import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { generateOTP } from "../../../services/generate-otp.js";
import { generateOTPForStaff, generateOTPForDealer } from "../../../services/generate-otp.js";
import { generateJWT, generateStaffJWT, generateDealerJWT } from "../../../services/generate-jwt-token.js";
import { sendEmail } from "../../../services/email.js";
import sendSMS from "../../../services/sms.js";
import { Staff, ProviderDealer } from "../../../prisma/db-models.js";
import {
  detectRole,
  findUserByContact,
  findStaffByContact,
  findDealerByContact,
  getFranchiseForStaff,
  getFranchiseForDealer,
  getFranchiseForOwner,
} from "./query.js";

// ─── POST /user/unified-send-otp ───
export const unifiedSendOtpEndpoint = async (req, res) => {
  try {
    const rawContact = (req.body.contact || "").trim();
    if (!rawContact) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Email or phone number is required");
    }

    const isEmail = rawContact.includes("@");
    const email = isEmail ? rawContact.toLowerCase() : null;
    const phone = isEmail ? null : rawContact;

    const result = await detectRole(email, phone);
    if (!result) {
      return returnResponse(res, StatusCodes.OK, "User not found", { found: false });
    }

    const { role, record } = result;
    let otpData;

    if (role === "owner" || role === "customer") {
      const customerExpiryMinutes = role === "customer" ? 1 : undefined;
      otpData = await generateOTP(record.id, customerExpiryMinutes);
    } else if (role === "staff") {
      if (record.phone) {
        otpData = await generateOTPForStaff(record.phone);
      } else if (email) {
        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_TIME) || 5;
        const otp_expiry = new Date();
        otp_expiry.setMinutes(otp_expiry.getMinutes() + expiryMinutes);
        await Staff.update({
          where: { id: record.id },
          data: { otp: `${otp}`, otp_expiry },
        });
        otpData = { otp, otp_expiry };
      }
    } else if (role === "dealer") {
      if (record.phone_number) {
        otpData = await generateOTPForDealer(record.phone_number);
      } else if (email) {
        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_TIME) || 5;
        const otp_expiry = new Date();
        otp_expiry.setMinutes(otp_expiry.getMinutes() + expiryMinutes);
        await ProviderDealer.update({
          where: { id: record.id },
          data: { otp: `${otp}`, otp_expiry },
        });
        otpData = { otp, otp_expiry };
      }
    }

    if (!otpData) {
      return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate OTP");
    }

    const targetEmail = email || record.email;
    const targetPhone = phone || record.phone_number || record.phone;

    const responseExpiryMinutes = role === "customer" ? 1 : (parseInt(process.env.OTP_EXPIRY_TIME) || 5);
    const expiryLabel = responseExpiryMinutes === 1 ? "1 minute" : `${responseExpiryMinutes} minutes`;

    if (targetEmail) {
      sendEmail(
        targetEmail,
        "Your E-Warrantify Login Code",
        `Your verification code is ${otpData.otp}. It expires in ${expiryLabel}. — Team E-Warrantify`
      ).catch((err) => logger.error(`OTP email failed: ${err.message}`));
    }

    if (targetPhone && !targetPhone.startsWith("temp_")) {
      sendSMS(targetPhone, "Phone+Validation+From+GVCC&var1=" + otpData.otp)
        .catch((err) => logger.error(`OTP SMS failed: ${err.message}`));
    }

    return returnResponse(res, StatusCodes.OK, "OTP sent successfully", {
      found: true,
      role,
      expiresInMs: responseExpiryMinutes * 60 * 1000,
      channel: targetEmail ? "email" : "phone",
    });
  } catch (error) {
    logger.error("unifiedSendOtpEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to send OTP");
  }
};

// ─── POST /user/unified-verify-otp ───
export const unifiedVerifyOtpEndpoint = async (req, res) => {
  try {
    const rawContact = (req.body.contact || "").trim();
    const otp = (req.body.otp || "").trim();

    if (!rawContact || !otp) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Contact and OTP are required");
    }

    const isEmail = rawContact.includes("@");
    const email = isEmail ? rawContact.toLowerCase() : null;
    const phone = isEmail ? null : rawContact;

    const result = await detectRole(email, phone);
    if (!result) {
      return returnError(res, StatusCodes.NOT_FOUND, "User not found");
    }

    const { role, record } = result;

    // Verify OTP match and expiry
    if (record.otp !== otp) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Invalid OTP");
    }
    if (record.otp_expiry && new Date(record.otp_expiry) < new Date()) {
      return returnError(res, StatusCodes.BAD_REQUEST, "OTP has expired. Please request a new one");
    }

    let token, responseData;

    if (role === "owner") {
      // Clear OTP
      const { User } = await import("../../../prisma/db-models.js");
      await User.update({
        where: { id: record.id },
        data: { otp: null, otp_expiry: null, is_otp_verified: true },
      });

      token = await generateJWT(record.id);
      const franchise = await getFranchiseForOwner(record.id);

      responseData = {
        token,
        role: "owner",
        user: {
          id: record.id,
          first_name: record.first_name,
          last_name: record.last_name,
          email: record.email,
          phone_number: record.phone_number,
          user_type: "owner",
        },
        franchise: franchise || null,
      };
    } else if (role === "customer") {
      const { User } = await import("../../../prisma/db-models.js");
      await User.update({
        where: { id: record.id },
        data: { otp: null, otp_expiry: null, is_otp_verified: true, otp_attempts: 0 },
      });

      token = await generateJWT(record.id);

      responseData = {
        token,
        role: "customer",
        user: {
          id: record.id,
          first_name: record.first_name,
          last_name: record.last_name,
          email: record.email,
          phone_number: record.phone_number,
          user_type: "customer",
          profile_completed: record.profile_completed || !!record.first_name,
        },
      };
    } else if (role === "staff") {
      await Staff.update({
        where: { id: record.id },
        data: { otp: null, otp_expiry: null },
      });

      token = await generateStaffJWT(record.id);
      const franchise = await getFranchiseForStaff(record.franchise_id);

      responseData = {
        token,
        role: "staff",
        user: {
          user_type: "staff",
          staff_id: record.id,
          name: record.name,
          email: record.email,
          phone: record.phone,
          role_type: record.role_type,
          department: record.department,
          region: record.region,
          employee_id: record.employee_id,
          staff_status: record.staff_status,
          designation: record.designation,
        },
        franchise: franchise || null,
      };
    } else if (role === "dealer") {
      await ProviderDealer.update({
        where: { id: record.id },
        data: { otp: null, otp_expiry: null },
      });

      token = await generateDealerJWT(record.id);
      const franchise = await getFranchiseForDealer(record.provider_id);

      responseData = {
        token,
        role: "dealer",
        user: {
          user_type: "dealer",
          id: record.id,
          name: record.name,
          email: record.email,
          phone_number: record.phone_number,
          provider_id: record.provider_id,
          dealer_key: record.dealer_key,
        },
        franchise: franchise || null,
      };
    }

    return returnResponse(res, StatusCodes.OK, "Login successful", responseData);
  } catch (error) {
    logger.error("unifiedVerifyOtpEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Verification failed");
  }
};
