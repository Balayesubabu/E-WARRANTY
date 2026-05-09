import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { generateJWT, generateStaffJWT, generateDealerJWT } from "../../../services/generate-jwt-token.js";
import {
  detectRole,
  getFranchiseForStaff,
  getFranchiseForDealer,
  getFranchiseForOwner,
} from "../unified-auth/query.js";

/**
 * POST /user/select-role
 * 
 * Multi-Role Authentication Endpoint
 * 
 * Real-world SaaS systems allow the same identity to have multiple roles:
 * - A person can be a Customer of one business and Staff at another
 * - A business owner might also register warranties as a customer
 * - This endpoint allows explicit role selection after multi-role detection
 * 
 * Flow:
 * 1. Frontend calls /check-user → gets { multipleRoles: true, roles: [...] }
 * 2. User selects desired role
 * 3. Frontend calls this endpoint with selected_role
 * 4. This endpoint validates and returns appropriate JWT + redirect info
 * 
 * Body: { contact: "email@example.com", selected_role: "staff" }
 * 
 * Response: { token, role, user, franchise?, redirectPath }
 */
export const selectRoleEndpoint = async (req, res) => {
  try {
    const { contact, selected_role } = req.body;

    if (!contact || !selected_role) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "Contact and selected_role are required"
      );
    }

    const trimmedContact = contact.trim();
    const isEmail = trimmedContact.includes("@");
    const email = isEmail ? trimmedContact.toLowerCase() : null;
    const phone = isEmail ? null : trimmedContact;

    const validRoles = ["owner", "customer", "staff", "dealer"];
    if (!validRoles.includes(selected_role)) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Invalid role. Must be one of: ${validRoles.join(", ")}`
      );
    }

    // Detect all roles for this contact
    const result = await detectRole(email, phone);

    if (!result) {
      return returnError(res, StatusCodes.NOT_FOUND, "User not found");
    }

    // Find the selected role in the detected roles
    let selectedRecord = null;

    if (result.multipleRoles) {
      // Multiple roles - find the selected one
      const found = result.roles.find((r) => r.role === selected_role);
      if (!found) {
        const availableRoles = result.roles.map((r) => r.role).join(", ");
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `Selected role "${selected_role}" not found. Available roles: ${availableRoles}`
        );
      }
      selectedRecord = found.record;
    } else {
      // Single role - verify it matches
      if (result.role !== selected_role) {
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `Selected role "${selected_role}" does not match your account role "${result.role}"`
        );
      }
      selectedRecord = result.record;
    }

    // Generate JWT and response based on selected role
    let token, responseData;

    if (selected_role === "owner") {
      token = await generateJWT(selectedRecord.id);
      const franchise = await getFranchiseForOwner(selectedRecord.id);

      responseData = {
        token,
        role: "owner",
        user: {
          id: selectedRecord.id,
          first_name: selectedRecord.first_name,
          last_name: selectedRecord.last_name,
          email: selectedRecord.email,
          phone_number: selectedRecord.phone_number,
          user_type: "owner",
        },
        franchise: franchise || null,
        redirectPath: "/owner",
      };
    } else if (selected_role === "customer") {
      token = await generateJWT(selectedRecord.id);

      responseData = {
        token,
        role: "customer",
        user: {
          id: selectedRecord.id,
          first_name: selectedRecord.first_name,
          last_name: selectedRecord.last_name,
          email: selectedRecord.email,
          phone_number: selectedRecord.phone_number,
          user_type: "customer",
          profile_completed: selectedRecord.profile_completed || !!selectedRecord.first_name,
        },
        redirectPath: "/home",
      };
    } else if (selected_role === "staff") {
      token = await generateStaffJWT(selectedRecord.id);
      const franchise = await getFranchiseForStaff(selectedRecord.franchise_id);

      responseData = {
        token,
        role: "staff",
        user: {
          user_type: "staff",
          staff_id: selectedRecord.id,
          name: selectedRecord.name,
          email: selectedRecord.email,
          phone: selectedRecord.phone,
          role_type: selectedRecord.role_type,
          department: selectedRecord.department,
          region: selectedRecord.region,
          employee_id: selectedRecord.employee_id,
          staff_status: selectedRecord.staff_status,
          designation: selectedRecord.designation,
        },
        franchise: franchise || null,
        redirectPath: "/staff",
      };
    } else if (selected_role === "dealer") {
      token = await generateDealerJWT(selectedRecord.id);
      const franchise = await getFranchiseForDealer(selectedRecord.provider_id);

      responseData = {
        token,
        role: "dealer",
        user: {
          user_type: "dealer",
          id: selectedRecord.id,
          name: selectedRecord.name,
          email: selectedRecord.email,
          phone_number: selectedRecord.phone_number,
          provider_id: selectedRecord.provider_id,
          dealer_key: selectedRecord.dealer_key,
        },
        franchise: franchise || null,
        redirectPath: "/dealer",
      };
    }

    logger.info(`Role selected: ${selected_role} for ${email || phone}`);
    return returnResponse(res, StatusCodes.OK, "Role selected successfully", responseData);
  } catch (error) {
    logger.error("selectRoleEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to select role");
  }
};
