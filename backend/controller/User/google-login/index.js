import axios from "axios";
import { StatusCodes } from "http-status-codes";
import { generateJWT } from "../../../services/generate-jwt-token.js";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import {
  checkOwnerSubscription,
  createCustomerFromGoogle,
  createOwnerFromGoogle,
  findUserByEmail,
  getFranchiseByOwnerId,
  getOwnerByUserId,
  updateGoogleAuthForUser,
  upgradeUserToOwner,
} from "./query.js";
import { giveWelcomeBonus, applyReferralCode } from "../../../services/coinService.js";
import {
  normalizeEmailForIdentity,
  findGlobalEmailLoginConflict,
  GLOBAL_EMAIL_IN_USE_MESSAGE,
} from "../../../utils/globalEmailIdentity.js";

const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

const verifyGoogleIdToken = async (idToken) => {
  const response = await axios.get(GOOGLE_TOKENINFO_URL, {
    params: { id_token: idToken },
    timeout: 10000,
  });

  const payload = response.data || {};
  if (!payload.sub || !payload.email) {
    throw new Error("Invalid Google token payload");
  }

  if (payload.email_verified !== "true") {
    throw new Error("Google email is not verified");
  }

  const configuredClientId = process.env.GOOGLE_CLIENT_ID;
  if (configuredClientId && payload.aud !== configuredClientId) {
    throw new Error("Google token audience mismatch");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || null,
    given_name: payload.given_name || null,
    family_name: payload.family_name || null,
  };
};

const isOwnerType = (userType) => userType === "owner" || userType === "provider";

const googleLoginEndpoint = async (req, res) => {
  try {
    logger.info("googleLoginEndpoint");
    const { id_token, role } = req.body || {};

    if (!id_token) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Google token is required");
    }

    if (!role || !["owner", "customer"].includes(role)) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Role must be owner or customer");
    }

    let googleUser;
    try {
      googleUser = await verifyGoogleIdToken(id_token);
    } catch (error) {
      logger.error(`Google token verification failed: ${error.message}`);
      return returnError(res, StatusCodes.UNAUTHORIZED, "Invalid Google login token");
    }

    let user = await findUserByEmail(googleUser.email);
    let isNewOwner = false;  // Track if this is a new owner for welcome bonus
    
    if (!user) {
      const googleEmailNorm = normalizeEmailForIdentity(googleUser.email);
      const reserved = await findGlobalEmailLoginConflict(googleEmailNorm, {});
      if (reserved) {
        return returnError(res, StatusCodes.CONFLICT, GLOBAL_EMAIL_IN_USE_MESSAGE, {
          code: "GLOBAL_EMAIL_IN_USE",
          existingRole: reserved,
        });
      }

      if (role === "customer") {
        user = await createCustomerFromGoogle({
          email: googleUser.email,
          googleSub: googleUser.sub,
          givenName: googleUser.given_name,
          familyName: googleUser.family_name,
          fullName: googleUser.name,
        });
        if (!user) {
          return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create account");
        }
        logger.info(`New customer created via Google: ${user.id}`);
      } else {
        user = await createOwnerFromGoogle({
          email: googleUser.email,
          googleSub: googleUser.sub,
          givenName: googleUser.given_name,
          familyName: googleUser.family_name,
          fullName: googleUser.name,
        });
        if (!user) {
          return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create owner account");
        }
        logger.info(`New owner created via Google: ${user.id}`);
        isNewOwner = true;  // Mark as new owner for welcome bonus
      }
    }

    if (role === "customer" && user.user_type !== "customer") {
      const actualRole = isOwnerType(user.user_type) ? "owner" : user.user_type || "owner";
      const roleLabels = { owner: "Business Owner", staff: "Staff", dealer: "Dealer" };
      return returnError(
        res,
        StatusCodes.FORBIDDEN,
        `This Google account is registered as ${roleLabels[actualRole] || actualRole}. Please use the ${roleLabels[actualRole] || actualRole} login.`,
        { redirectRole: actualRole }
      );
    }

    if (role === "owner" && !isOwnerType(user.user_type)) {
      // If user_type is null/undefined, the user started owner signup but didn't complete
      // Allow them to continue as owner via Google login
      if (!user.user_type) {
        logger.info(`--- User ${user.id} has no user_type, upgrading to owner via Google ---`);
        try {
          user = await upgradeUserToOwner(user, googleUser.sub);
          isNewOwner = true; // Mark as new owner for welcome bonus
          logger.info(`--- User ${user.id} upgraded to owner successfully ---`);
        } catch (upgradeError) {
          logger.error(`--- Failed to upgrade user to owner: ${upgradeError.message} ---`);
          return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to complete owner setup");
        }
      } else {
        // User has a different role (customer, staff, dealer) - block them
        const actualRole = user.user_type;
        const roleLabels = { customer: "Customer", staff: "Staff", dealer: "Dealer" };
        return returnError(
          res,
          StatusCodes.FORBIDDEN,
          `This Google account is registered as ${roleLabels[actualRole] || actualRole}. Please use the ${roleLabels[actualRole] || actualRole} login.`,
          { redirectRole: actualRole }
        );
      }
    }

    // Prevent accidental account-link takeover.
    if (user.google_sub && user.google_sub !== googleUser.sub) {
      return returnError(
        res,
        StatusCodes.UNAUTHORIZED,
        "Google account mismatch for this email."
      );
    }

    // Link Google profile to existing account (first-time Google sign in).
    if (!user.google_sub || user.auth_provider !== "google" || user.is_email_verified !== true) {
      await updateGoogleAuthForUser(user.id, googleUser.sub);
    }

    const token = await generateJWT(user.id);
    if (!token) {
      return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "JWT token generation failed");
    }

    if (role === "customer") {
      return returnResponse(res, StatusCodes.OK, "Google login successful", {
        token,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          user_type: user.user_type,
          profile_completed: user.profile_completed === true,
        },
      });
    }

    const owner = await getOwnerByUserId(user.id);
    if (!owner) {
      return returnError(res, StatusCodes.NOT_FOUND, "No owner found");
    }
    if (owner.is_blocked) {
      logger.error(`--- Provider/owner account is blocked (provider_id: ${owner.id}) ---`);
      return returnError(res, StatusCodes.FORBIDDEN, "Your account has been blocked. Please contact support.");
    }
    if (owner.is_deleted) {
      logger.error(`--- Provider/owner account is deleted (provider_id: ${owner.id}) ---`);
      return returnError(res, StatusCodes.FORBIDDEN, "Account not found.");
    }

    const franchiseOne = await getFranchiseByOwnerId(owner.id);
    if (!franchiseOne) {
      return returnError(res, StatusCodes.NOT_FOUND, "No franchises found");
    }

    // ═══════════════════════════════════════════════════════════════
    // COINS: Give welcome bonus to new owner (Google signup)
    // ═══════════════════════════════════════════════════════════════
    let welcomeBonusResult = null;
    let referralResult = null;
    
    if (isNewOwner) {
      try {
        logger.info(`--- Giving welcome bonus to new Google owner ${owner.id} ---`);
        welcomeBonusResult = await giveWelcomeBonus(owner.id);
        if (welcomeBonusResult.success) {
          logger.info(`--- Welcome bonus of ${welcomeBonusResult.bonus} coins given to owner ${owner.id} ---`);
        }
      } catch (coinError) {
        logger.error(`--- Failed to give welcome bonus: ${coinError.message} ---`);
      }

      // Apply referral code if provided in request
      const { referral_code } = req.body;
      if (referral_code) {
        try {
          logger.info(`--- Applying referral code ${referral_code} for owner ${owner.id} ---`);
          referralResult = await applyReferralCode(owner.id, referral_code);
          if (referralResult.success) {
            logger.info(`--- Referral code applied successfully for owner ${owner.id} ---`);
          } else {
            logger.info(`--- Referral code not applied: ${referralResult.message} ---`);
          }
        } catch (referralError) {
          logger.error(`--- Failed to apply referral code: ${referralError.message} ---`);
        }
      }
    }

    const subscription = await checkOwnerSubscription(owner.id);
    const isSubscriptionActive = Boolean(
      subscription &&
        subscription.is_base_plan_active &&
        subscription.end_date > new Date() &&
        subscription.is_cancelled === false &&
        subscription.is_active === true
    );

    return returnResponse(res, StatusCodes.OK, "Google login successful", {
      token,
      isSubscriptionActive,
      franchiseOne,
      profile_completed: user.profile_completed === true,
      welcome_bonus: welcomeBonusResult,
      referral_applied: referralResult,
    });
  } catch (error) {
    logger.error(`Error in googleLoginEndpoint: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { googleLoginEndpoint };
