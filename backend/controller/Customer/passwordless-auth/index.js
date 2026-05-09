import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { generateOTP } from "../../../services/generate-otp.js";
import { generateJWT } from "../../../services/generate-jwt-token.js";
import { sendEmail } from "../../../services/email.js";
import sendSMS from "../../../services/sms.js";
import {
  findUserByEmailOrPhone, createCustomerUser, updateUserOtpAttempts,
  updateUserOtpRequestCount, resetUserOtpAttempts, setUserVerifiedAndProfile,
  completeUserProfile, getUserById, detectExistingRole,
  findUserByPhoneExcluding,
} from "./query.js";
import { normalizeIndianMobile, isValidIndianMobile } from "../../../utils/indianMobile.js";
import {
  normalizeEmailForIdentity,
  findGlobalEmailLoginConflict,
  GLOBAL_EMAIL_IN_USE_MESSAGE,
} from "../../../utils/globalEmailIdentity.js";

const MAX_OTP_ATTEMPTS = 5;
const OTP_REQUEST_COOLDOWN_MS = 60 * 1000; // 1 minute between requests
const MAX_OTP_REQUESTS_PER_HOUR = 10;

/** One email/phone must map to at most one account type; customer OTP flow rejects if already used for another role. */
const CONTACT_USED_BY_OTHER_ROLE_MESSAGE =
  "This email or phone number is already registered to another type of account. Please use a different email or phone number.";

const returnContactInUse = (res, existingRole) => {
  logger.info(`Customer flow blocked: contact in use by role "${existingRole}"`);
  return returnError(res, StatusCodes.CONFLICT, CONTACT_USED_BY_OTHER_ROLE_MESSAGE, {
    code: "CONTACT_IN_USE",
    existingRole,
  });
};

// ─── POST /customer/auth — Unified: send OTP (auto-create if new) ───

export const customerAuthEndpoint = async (req, res) => {
  try {
    const { email, phone_number, country_code } = req.body;

    const effectiveEmail = email != null && String(email).trim() ? String(email).trim() : null;
    let effectivePhone = null;
    if (phone_number != null && String(phone_number).trim()) {
      effectivePhone = normalizeIndianMobile(phone_number);
      if (!isValidIndianMobile(effectivePhone)) {
        return returnError(res, StatusCodes.BAD_REQUEST, "Please enter a correct 10-digit Indian mobile number");
      }
    }

    if (!effectiveEmail && !effectivePhone) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Email or phone number is required");
    }

    const existingRole = await detectExistingRole(effectiveEmail, effectivePhone);
    if (existingRole && existingRole !== "customer") {
      return returnContactInUse(res, existingRole);
    }

    let user = await findUserByEmailOrPhone(effectiveEmail, effectivePhone);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      try {
        user = await createCustomerUser({ email: effectiveEmail, phone_number: effectivePhone, country_code });
      } catch (e) {
        if (e?.code === "GLOBAL_EMAIL_IN_USE") {
          return returnError(res, StatusCodes.CONFLICT, e.message, {
            code: "GLOBAL_EMAIL_IN_USE",
            existingRole: e.existingRole,
          });
        }
        throw e;
      }
      if (!user) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create account");
      }
      logger.info(`New customer created: ${user.id}`);
    }

    if (user.user_type === "owner" || user.user_type === "super_admin") {
      return returnContactInUse(res, user.user_type === "super_admin" ? "super_admin" : "owner");
    }

    // Rate limiting: check cooldown
    if (user.otp_last_request) {
      const timeSinceLast = Date.now() - new Date(user.otp_last_request).getTime();
      if (timeSinceLast < OTP_REQUEST_COOLDOWN_MS) {
        const waitSec = Math.ceil((OTP_REQUEST_COOLDOWN_MS - timeSinceLast) / 1000);
        return returnError(res, StatusCodes.TOO_MANY_REQUESTS, `Please wait ${waitSec} seconds before requesting another OTP`);
      }
    }

    // Rate limiting: max requests per hour
    if (user.otp_request_count >= MAX_OTP_REQUESTS_PER_HOUR && user.otp_last_request) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(user.otp_last_request) > hourAgo) {
        return returnError(res, StatusCodes.TOO_MANY_REQUESTS, "Too many OTP requests. Please try again later");
      }
    }

    // Generate and send OTP
    const otpData = await generateOTP(user.id);
    if (!otpData) {
      return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate OTP");
    }

    await updateUserOtpRequestCount(user.id);

    // Send OTP via appropriate channel
    const targetEmail = effectiveEmail || user.email;
    const targetPhone = effectivePhone || user.phone_number;

    if (targetEmail) {
      sendEmail(
        targetEmail,
        "Your E-Warrantify Verification Code",
        `Your verification code is ${otpData.otp}. This code expires in ${process.env.OTP_EXPIRY_TIME || 5} minutes. — Team E-Warrantify`
      ).catch((err) => logger.error(`Failed to send OTP email: ${err.message}`));
    }

    if (targetPhone && !targetPhone.startsWith("temp_")) {
      sendSMS(targetPhone, "Phone+Validation+From+GVCC&var1=" + otpData.otp)
        .catch((err) => logger.error(`Failed to send OTP SMS: ${err.message}`));
    }

    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_TIME) || 5;

    return returnResponse(res, StatusCodes.OK, "OTP sent successfully", {
      isNewUser,
      expiresInMs: expiryMinutes * 60 * 1000,
      channel: targetEmail ? "email" : "phone",
    });
  } catch (error) {
    logger.error("customerAuthEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Authentication failed");
  }
};

// ─── POST /customer/verify-auth-otp — Verify OTP, login/create session ───

export const customerVerifyOtpEndpoint = async (req, res) => {
  try {
    const { email, phone_number, otp } = req.body;

    const effectiveEmail = email != null && String(email).trim() ? String(email).trim() : null;
    let effectivePhone = null;
    if (phone_number != null && String(phone_number).trim()) {
      effectivePhone = normalizeIndianMobile(phone_number);
      if (!isValidIndianMobile(effectivePhone)) {
        return returnError(res, StatusCodes.BAD_REQUEST, "Please enter a correct 10-digit Indian mobile number");
      }
    }

    if ((!effectiveEmail && !effectivePhone) || !otp) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Email/phone and OTP are required");
    }

    const user = await findUserByEmailOrPhone(effectiveEmail, effectivePhone);
    if (!user) {
      return returnError(res, StatusCodes.NOT_FOUND, "User not found");
    }

    if (user.user_type === "owner" || user.user_type === "super_admin") {
      return returnContactInUse(res, user.user_type === "super_admin" ? "super_admin" : "owner");
    }

    const conflictRole = await detectExistingRole(effectiveEmail, effectivePhone);
    if (conflictRole && conflictRole !== "customer") {
      return returnContactInUse(res, conflictRole);
    }

    // Check OTP attempts
    if (user.otp_attempts >= MAX_OTP_ATTEMPTS) {
      return returnError(res, StatusCodes.TOO_MANY_REQUESTS, "Too many failed attempts. Please request a new OTP");
    }

    // Verify OTP value
    if (user.otp !== `${otp}`) {
      await updateUserOtpAttempts(user.id, (user.otp_attempts || 0) + 1);
      const remaining = MAX_OTP_ATTEMPTS - (user.otp_attempts || 0) - 1;
      return returnError(res, StatusCodes.BAD_REQUEST, `Invalid OTP. ${remaining} attempt(s) remaining`);
    }

    // Check OTP expiry
    if (user.otp_expiry && new Date(user.otp_expiry) < new Date()) {
      return returnError(res, StatusCodes.BAD_REQUEST, "OTP has expired. Please request a new one");
    }

    // Mark user as verified
    await setUserVerifiedAndProfile(user.id);

    // Generate JWT
    const token = await generateJWT(user.id);
    if (!token) {
      return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Session creation failed");
    }

    // Rely on DB flag only — do not infer from first_name (legacy users may have a name
    // without having completed the customer "complete profile" step after OTP).
    const profileCompleted = user.profile_completed === true;

    return returnResponse(res, StatusCodes.OK, "Verification successful", {
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        user_type: user.user_type || "customer",
        profile_completed: profileCompleted,
        city: user.city,
      },
      profileCompleted,
    });
  } catch (error) {
    logger.error("customerVerifyOtpEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Verification failed");
  }
};

// ─── POST /customer/complete-profile — Update minimal profile info ───

export const customerCompleteProfileEndpoint = async (req, res) => {
  try {
    const { first_name, last_name, email, city, phone_number } = req.body;
    const userId = req.user_id;

    if (!userId) {
      return returnError(res, StatusCodes.UNAUTHORIZED, "Not authenticated");
    }

    if (!first_name) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Full name is required");
    }

    const user = await getUserById(userId);
    if (!user) {
      return returnError(res, StatusCodes.NOT_FOUND, "User not found");
    }

    const existingPhoneNorm =
      user.phone_number && !String(user.phone_number).startsWith("temp_")
        ? normalizeIndianMobile(user.phone_number)
        : null;

    let normalizedProfilePhone = null;
    if (phone_number != null && String(phone_number).trim()) {
      normalizedProfilePhone = normalizeIndianMobile(phone_number);
      if (!isValidIndianMobile(normalizedProfilePhone)) {
        return returnError(res, StatusCodes.BAD_REQUEST, "Please enter a correct 10-digit Indian mobile number");
      }
      if (normalizedProfilePhone !== existingPhoneNorm) {
        const roleOnPhone = await detectExistingRole(null, normalizedProfilePhone);
        if (roleOnPhone && roleOnPhone !== "customer") {
          return returnContactInUse(res, roleOnPhone);
        }
        const phoneDup = await findUserByPhoneExcluding(normalizedProfilePhone, userId);
        if (phoneDup) {
          return returnError(res, StatusCodes.CONFLICT, "This phone number is already registered to another account");
        }
      }
    }

    const trimmedEmail = email != null ? String(email).trim() : "";
    const currentEmailLower = (user.email || "").trim().toLowerCase();
    const profileEmailNorm = normalizeEmailForIdentity(trimmedEmail);
    if (profileEmailNorm && profileEmailNorm !== currentEmailLower) {
      const reserved = await findGlobalEmailLoginConflict(profileEmailNorm, { excludeUserId: userId });
      if (reserved) {
        return returnError(res, StatusCodes.CONFLICT, GLOBAL_EMAIL_IN_USE_MESSAGE, {
          code: "GLOBAL_EMAIL_IN_USE",
          existingRole: reserved,
        });
      }
    }

    const updated = await completeUserProfile(userId, {
      first_name,
      last_name,
      email: trimmedEmail || undefined,
      city,
      phone_number: normalizedProfilePhone || undefined,
    });

    return returnResponse(res, StatusCodes.OK, "Profile completed", {
      user: {
        id: updated.id,
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
        phone_number: updated.phone_number,
        user_type: updated.user_type || "customer",
        profile_completed: true,
        city: updated.city,
      },
    });
  } catch (error) {
    logger.error("customerCompleteProfileEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update profile");
  }
};
