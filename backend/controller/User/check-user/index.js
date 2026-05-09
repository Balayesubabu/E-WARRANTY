import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { detectRole } from "../unified-auth/query.js";

/**
 * POST /user/check-user
 * Check if a user exists by email or phone.
 * 
 * Real-world SaaS Enhancement:
 * - Same identity may have multiple roles (e.g., Customer + Staff)
 * - If multiple roles exist, returns all roles for user selection
 * - Maintains backward compatibility for single-role users
 * 
 * Response formats:
 * - Not found:      { exists: false }
 * - Single role:    { exists: true, user_type: "staff" }
 * - Multiple roles: { exists: true, multipleRoles: true, roles: ["customer", "staff"] }
 */
export const checkUserEndpoint = async (req, res) => {
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
      return returnResponse(res, StatusCodes.OK, "User not found", {
        exists: false,
      });
    }

    // Multiple roles detected - return all roles for user selection
    if (result.multipleRoles) {
      const roleNames = result.roles.map((r) => r.role);
      logger.info(`Multiple roles detected for ${email || phone}: ${roleNames.join(", ")}`);
      return returnResponse(res, StatusCodes.OK, "Multiple accounts found", {
        exists: true,
        multipleRoles: true,
        roles: roleNames,
      });
    }

    // Single role - maintain backward compatible response
    return returnResponse(res, StatusCodes.OK, "User found", {
      exists: true,
      user_type: result.role,
    });
  } catch (error) {
    logger.error("checkUserEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to check user");
  }
};
