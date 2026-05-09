import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { returnError } from "../services/logger.js";

const extractToken = (authHeader) => {
  if (!authHeader) return null;
  return authHeader.replace(/^Bearer\s+/i, "");
};

/**
 * Route guard using JWT claims `role` (RoleName) and optional `subRole` (SubRoleName).
 * Issue new tokens after login to receive these claims; legacy tokens may lack them.
 *
 * @param {{ roles?: string[], subRoles?: string[] }} options
 * @example router.get("/admin-only", verifySuperAdminToken, authorize({ roles: ["SUPER_ADMIN"] }), handler)
 * @example router.get("/dealer-only", verifyLoginToken, authorize({ roles: ["BUSINESS_OWNER"], subRoles: ["DEALER"] }), handler)
 */
export const authorize = (options = {}) => {
  const roles = options.roles?.length ? options.roles.map(String) : [];
  const subRoles = options.subRoles?.length ? options.subRoles.map(String) : [];

  return (req, res, next) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return returnError(res, StatusCodes.UNAUTHORIZED, "Unauthorized");
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      let role = decoded.role;
      let subRole = decoded.subRole ?? null;
      if (!role && decoded.legacyLoginRole) {
        const l = decoded.legacyLoginRole;
        if (l === "super_admin") role = "SUPER_ADMIN";
        else if (l === "customer") role = "CUSTOMER";
        else if (l === "owner") role = "BUSINESS_OWNER";
        else if (l === "staff") {
          role = "BUSINESS_OWNER";
          subRole = subRole || "STAFF";
        } else if (l === "dealer") {
          role = "BUSINESS_OWNER";
          subRole = subRole || "DEALER";
        } else if (l === "service_center") {
          role = "BUSINESS_OWNER";
          subRole = subRole || "SERVICE_CENTER";
        }
      }

      if (roles.length && !roles.includes(role)) {
        return returnError(res, StatusCodes.FORBIDDEN, "Insufficient role", {
          required_roles: roles,
        });
      }
      if (subRoles.length) {
        if (!subRole || !subRoles.includes(subRole)) {
          return returnError(res, StatusCodes.FORBIDDEN, "Insufficient sub-role", {
            required_sub_roles: subRoles,
          });
        }
      }

      req.authClaims = decoded;
      req.authUserId = decoded.userId ?? decoded.id;
      req.authRole = role;
      req.authSubRole = subRole;
      next();
    } catch (e) {
      return returnError(res, StatusCodes.UNAUTHORIZED, "Invalid or expired token");
    }
  };
};
