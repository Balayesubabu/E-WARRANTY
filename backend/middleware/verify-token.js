import { StatusCodes } from "http-status-codes";
import { logger, returnError } from "../services/logger.js";
import jwt from "jsonwebtoken";
import { User, Staff, Franchise, Provider, ProviderDealer, ServiceCenter } from "../prisma/db-models.js";
import crypto from "crypto";

/**
 * Helper function to extract token from Authorization header
 * Handles both "Bearer <token>" and raw "<token>" formats
 */
const extractToken = (authHeader) => {
    if (!authHeader) return null;
    // Remove "Bearer " prefix if present
    return authHeader.replace(/^Bearer\s+/i, '');
};

const getNormalizedPath = (req) => {
    return (req.originalUrl || req.baseUrl || req.path || "").toLowerCase();
};

const canStaffAccessByRole = (req, staffRoleType) => {
    const path = getNormalizedPath(req);
    const method = (req.method || "GET").toUpperCase();

    const isDealerManagement =
        path.includes("/dealer/create-dealer") ||
        path.includes("/dealer/deactivate/") ||
        path.includes("/dealer/reactivate/") ||
        path.includes("/dealer/delete/") ||
        (path.startsWith("/dealer/") && method === "PUT");

    const isProviderAdmin =
        path.includes("/owner/generate-api-key") ||
        path.includes("/owner/get-api-key") ||
        path.includes("/owner/update-api-key") ||
        path.includes("/user/generate-api-key") ||
        path.includes("/user/get-api-key") ||
        path.includes("/user/update-api-key");

    const isStaffAdmin =
        path.includes("/staff/create-staff") ||
        path.includes("/staff/update-staff-role") ||
        path.includes("/staff/staff-role/");

    const isWarrantyAdmin =
        path.includes("/e-warranty/settings/") ||
        path.includes("/e-warranty/e-warranty-products/");

    const isDealerWarrantyAssignment =
        path.includes("/e-warranty/product-warranty-code/assign-warranty-code-dealer");

    const isProductWarrantyCode =
        path.includes("/e-warranty/product-warranty-code/");

    const isMonitoringRoute =
        path.includes("/reports/") ||
        path.endsWith("/reports") ||
        path.includes("/dashboard");

    const isStaffSelfService =
        path.includes("/staff/get-staff-profile") ||
        path.includes("/staff/change-password") ||
        path.includes("/staff/forgot-reset-password");

    if (staffRoleType === "Manager" || staffRoleType === "Admin") {
        return true;
    }

    if (staffRoleType === "Superviser" || staffRoleType === "RegionalManager") {
        if (isStaffSelfService || isMonitoringRoute) {
            return true;
        }
        return method === "GET";
    }

    if (staffRoleType === "ClaimsManager") {
        if (isStaffSelfService) return true;
        const isClaimRoute = path.includes("/warranty-claim") || path.includes("/e-warranty/warranty-customer");
        if (isClaimRoute) return true;
        if (isMonitoringRoute && method === "GET") return true;
        if (isDealerManagement || isProviderAdmin || isStaffAdmin || isWarrantyAdmin) return false;
        return method === "GET";
    }

    if (staffRoleType === "Finance") {
        if (isStaffSelfService) return true;
        const isFinanceRoute = path.includes("/erp/ledger") || path.includes("/erp/purchase-orders") || path.includes("/erp/dashboard-stats");
        if (isFinanceRoute) return true;
        if (isMonitoringRoute && method === "GET") return true;
        if (isDealerManagement || isProviderAdmin || isStaffAdmin || isWarrantyAdmin) return false;
        return method === "GET";
    }

    if (staffRoleType === "Support") {
        if (isStaffSelfService) return true;
        const isSupportRoute = path.includes("/supportticket") || path.includes("/support-ticket");
        if (isSupportRoute) return true;
        if (isDealerManagement || isProviderAdmin || isStaffAdmin || isWarrantyAdmin || isDealerWarrantyAssignment) return false;
        return method === "GET";
    }

    // Staff role: allow when owner has assigned ability (warranty settings, product/code management, dealers, assign to dealers)
    if (staffRoleType === "Staff") {
        if (isStaffSelfService) return true;
        if (isWarrantyAdmin || isProductWarrantyCode || isDealerWarrantyAssignment || isDealerManagement) return true;
        if (isProviderAdmin || isStaffAdmin) return false;
        return method === "GET";
    }

    if (
        isDealerManagement ||
        isProviderAdmin ||
        isStaffAdmin ||
        isWarrantyAdmin ||
        isDealerWarrantyAssignment
    ) {
        return false;
    }

    return true;
};

const verifyToken = async (req, res, next) => {
    try {
            logger.info(`verifyToken`);
            logger.info(`--- All headers: ${JSON.stringify(req.headers)} ---`);
            logger.info(`--- Fetching token from the request ---`);
            const token = extractToken(req.headers.authorization);
            const franchise_id = req.headers['franchise_id'];

            if (franchise_id) {
                const franchiseId = await Franchise.findUnique({
                        where: {    
                            id: franchise_id
                        }  
                    });
                if (!franchiseId) {
                    return returnError(res, StatusCodes.BAD_REQUEST, "Franchise id is invalid");
                }
                logger.info(`--- Franchise id: ${franchise_id} ---`);
            }
            else{
                return returnError(res, StatusCodes.BAD_REQUEST, "Franchise id is required");
            }
            
            logger.info(`--- Token: ${token} ---`);
            if (!token) {
                logger.info(`--- Token is not provided ---`);
                return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
            }
            const is_staff = req.headers['is_staff'];
            const is_dealer = req.headers['is_dealer'];
            const is_service_center = req.headers['is_service_center'];

            if (is_staff && is_staff === 'true') {
                logger.info(`--- Token belongs to staff ---`);
                logger.info(`--- Verifying staff token ---`);
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                logger.info(`--- Decoded: ${JSON.stringify(decoded)} ---`);
                const staff = await Staff.findUnique({
                    where: {
                        id: decoded.id
                    }
                });
                if (!staff) {
                    logger.error(`--- User not found with id: ${decoded.id} ---`);
                    return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                }
                if (staff.staff_status !== "ACTIVE" || !staff.is_active) {
                    logger.error(`--- Staff account is deactivated with id: ${decoded.id} ---`);
                    return returnError(res, StatusCodes.FORBIDDEN, `Your account has been deactivated. Please contact your administrator.`);
                }
                logger.info(`--- Fetching Provider id from  id: ${staff.provider_id} ---`);
                const provider = await Provider.findUnique({
                    where: {
                        id: staff.provider_id
                    }
                });
                if (!provider) {
                    logger.error(`--- Provider not found with id: ${staff.provider_id} ---`);
                    return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                }
                if (provider.is_blocked) {
                    logger.error(`--- Provider is blocked (id: ${provider.id}) ---`);
                    return returnError(res, StatusCodes.FORBIDDEN, `Your organization's account has been blocked. Please contact support.`);
                }
                logger.info(`--- Fetched Provider id from  id: ${staff.provider_id} ---`);
                req.user_id = provider.user_id;
                req.provider_id = provider.id;
                req.staff_id = staff.id;
                req.staff_role_type = staff.role_type || "Staff";
                req.franchise_id = franchise_id;
                req.type = 'staff';
                req.role = 'staff';
                if (!canStaffAccessByRole(req, req.staff_role_type)) {
                    return returnError(res, StatusCodes.FORBIDDEN, `Access denied for staff role: ${req.staff_role_type}`);
                }
                logger.info(`--- User id: ${req.user_id} ---`);
                next();
            }
            else if (is_dealer && is_dealer === 'true') {
                logger.info(`--- Token belongs to dealer ---`);
                logger.info(`--- Verifying dealer token ---`);
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                logger.info(`--- Decoded: ${JSON.stringify(decoded)} ---`);
                const dealer = await ProviderDealer.findUnique({
                    where: {
                        id: decoded.id
                    }
                });
                if (!dealer) {
                    logger.error(`--- Dealer not found with id: ${decoded.id} ---`);
                    return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                }
                if (dealer.status !== "ACTIVE" || !dealer.is_active || dealer.is_deleted) {
                    logger.error(`--- Dealer is inactive with id: ${decoded.id} ---`);
                    return returnError(res, StatusCodes.FORBIDDEN, `Dealer is inactive`);
                }
                logger.info(`--- Fetching Provider id from dealer: ${dealer.provider_id} ---`);
                const provider = await Provider.findUnique({
                    where: {
                        id: dealer.provider_id
                    }
                });
                if (!provider) {
                    logger.error(`--- Provider not found with id: ${dealer.provider_id} ---`);
                    return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                }
                if (provider.is_blocked) {
                    logger.error(`--- Provider is blocked (id: ${provider.id}) ---`);
                    return returnError(res, StatusCodes.FORBIDDEN, `Your organization's account has been blocked. Please contact support.`);
                }
                logger.info(`--- Fetched Provider id: ${dealer.provider_id} ---`);
                req.user_id = provider.user_id;
                req.dealer_id = dealer.id;
                req.provider_id = dealer.provider_id;
                req.franchise_id = franchise_id;
                req.type = 'dealer';
                req.role = 'dealer';
                logger.info(`--- User id: ${req.user_id}, Dealer id: ${req.dealer_id} ---`);
                next();
            }
            else if (is_service_center && is_service_center === 'true') {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const sc = await ServiceCenter.findUnique({ where: { id: decoded.id } });
                if (!sc) return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                if (!sc.is_active || sc.is_deleted) return returnError(res, StatusCodes.FORBIDDEN, `Service center account is inactive`);
                const provider = await Provider.findUnique({ where: { id: sc.provider_id } });
                if (!provider) return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                if (provider.is_blocked) return returnError(res, StatusCodes.FORBIDDEN, `Your organization's account has been blocked. Please contact support.`);
                req.user_id = provider.user_id;
                req.service_center_id = sc.id;
                req.provider_id = sc.provider_id;
                req.franchise_id = franchise_id;
                req.type = 'service_center';
                req.role = 'service_center';
                next();
            }
            else {
                logger.info(`--- Token belongs to provider ---`);
                logger.info(`--- Verifying token ---`);
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                logger.info(`--- Decoded: ${JSON.stringify(decoded)} ---`);
                const user = await User.findUnique({
                    where: {
                        id: decoded.id
                    }
                }); 
                if (!user) {
                    logger.error(`--- User not found with id: ${decoded.id} ---`);
                    return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                }
                const provider = await Provider.findFirst({ where: { user_id: user.id } });
                if (provider?.is_blocked) {
                    logger.error(`--- Provider is blocked (id: ${provider.id}) ---`);
                    return returnError(res, StatusCodes.FORBIDDEN, `Your account has been blocked. Please contact support.`);
                }
                req.user_id = user.id;
                req.type = 'provider';
                req.role = 'owner';
                req.franchise_id = franchise_id;
                logger.info(`--- User id: ${req.user_id} ---`);
                next();
            }
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

const verifyStaffToken = async (req, res, next) => {
    try {
        logger.info(`verifyStaffToken`);
        logger.info(`--- All headers: ${JSON.stringify(req.headers)} ---`);

        logger.info(`--- Fetching token from the request ---`);
        const token = extractToken(req.headers.authorization);
        logger.info(`--- Token: ${token} ---`);

        if (!token) {
            logger.info(`--- Token is not provided ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
        }

        logger.info(`--- Verifying token ---`);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.info(`--- Decoded: ${JSON.stringify(decoded)} ---`);
        const user = await Staff.findUnique({
            where: {
                id: decoded.id
            }
        });
        if (!user) {
            logger.error(`--- User not found with id: ${decoded.id} ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
        }
        req.user_id = user.id;
        req.email = user.email;
        req.phone_number = user.phone;
        req.role = 'staff';
        req.staff_role_type = user.role_type || "Staff";
        logger.info(`--- User id: ${req.user_id} ---`);

        next();
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

const verifyLoginToken = async (req, res, next) => {
    try {
            logger.info(`verifyLoginToken`);
            logger.info(`--- All headers: ${JSON.stringify(req.headers)} ---`);
            logger.info(`--- Fetching token from the request ---`);
            const token = extractToken(req.headers.authorization);
            
            logger.info(`--- Token: ${token} ---`);
            if (!token) {
                logger.info(`--- Token is not provided ---`);
                return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
            }
            const is_staff = req.headers['is_staff'];
            const is_dealer = req.headers['is_dealer'];
            const is_service_center = req.headers['is_service_center'];

            if (is_staff && is_staff === 'true') {
                logger.info(`--- Token belongs to staff ---`);
                logger.info(`--- Verifying staff token ---`);
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                logger.info(`--- Decoded: ${JSON.stringify(decoded)} ---`);
                const staff = await Staff.findUnique({
                    where: {
                        id: decoded.id
                    }
                });
                if (!staff) {
                    logger.error(`--- User not found with id: ${decoded.id} ---`);
                    return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                }
                if (staff.staff_status !== "ACTIVE" || !staff.is_active) {
                    logger.error(`--- Staff account is deactivated with id: ${decoded.id} ---`);
                    return returnError(res, StatusCodes.FORBIDDEN, `Your account has been deactivated. Please contact your administrator.`);
                }
                logger.info(`--- Fetching Provider id from  id: ${staff.provider_id} ---`);
                const provider = await Provider.findUnique({
                    where: {
                        id: staff.provider_id
                    }
                });
                if (!provider) {
                    logger.error(`--- Provider not found with id: ${staff.provider_id} ---`);
                    return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                }
                if (provider.is_blocked) {
                    logger.error(`--- Provider is blocked (id: ${provider.id}) ---`);
                    return returnError(res, StatusCodes.FORBIDDEN, `Your organization's account has been blocked. Please contact support.`);
                }
                logger.info(`--- Fetched Provider id from  id: ${staff.provider_id} ---`);
                req.user_id = provider.user_id;
                req.provider_id = provider.id;
                req.staff_id = staff.id;
                req.staff_role_type = staff.role_type || "Staff";
                req.type = 'staff';
                req.role = 'staff';
                if (!canStaffAccessByRole(req, req.staff_role_type)) {
                    return returnError(res, StatusCodes.FORBIDDEN, `Access denied for staff role: ${req.staff_role_type}`);
                }
                logger.info(`--- User id: ${req.user_id} ---`);
                next();
            }
            else if (is_dealer && is_dealer === 'true') {
                logger.info(`--- Token belongs to dealer ---`);
                logger.info(`--- Verifying dealer token ---`);
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                logger.info(`--- Decoded: ${JSON.stringify(decoded)} ---`);
                const dealer = await ProviderDealer.findUnique({
                    where: {
                        id: decoded.id
                    }
                });
                if (!dealer) {
                    logger.error(`--- Dealer not found with id: ${decoded.id} ---`);
                    return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                }
                if (dealer.status !== "ACTIVE" || !dealer.is_active || dealer.is_deleted) {
                    logger.error(`--- Dealer is inactive with id: ${decoded.id} ---`);
                    return returnError(res, StatusCodes.FORBIDDEN, `Dealer is inactive`);
                }
                logger.info(`--- Fetching Provider id from dealer: ${dealer.provider_id} ---`);
                const provider = await Provider.findUnique({
                    where: {
                        id: dealer.provider_id
                    }
                });
                if (!provider) {
                    logger.error(`--- Provider not found with id: ${dealer.provider_id} ---`);
                    return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                }
                if (provider.is_blocked) {
                    logger.error(`--- Provider is blocked (id: ${provider.id}) ---`);
                    return returnError(res, StatusCodes.FORBIDDEN, `Your organization's account has been blocked. Please contact support.`);
                }
                logger.info(`--- Fetched Provider id: ${dealer.provider_id} ---`);
                req.user_id = provider.user_id;
                req.dealer_id = dealer.id;
                req.provider_id = dealer.provider_id;
                req.type = 'dealer';
                req.role = 'dealer';
                logger.info(`--- User id: ${req.user_id}, Dealer id: ${req.dealer_id} ---`);
                next();
            }
            else if (is_service_center && is_service_center === 'true') {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const sc = await ServiceCenter.findUnique({ where: { id: decoded.id } });
                if (!sc) return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                if (!sc.is_active || sc.is_deleted) return returnError(res, StatusCodes.FORBIDDEN, `Service center account is inactive`);
                const provider = await Provider.findUnique({ where: { id: sc.provider_id } });
                if (!provider) return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                if (provider.is_blocked) return returnError(res, StatusCodes.FORBIDDEN, `Your organization's account has been blocked. Please contact support.`);
                req.user_id = provider.user_id;
                req.service_center_id = sc.id;
                req.provider_id = sc.provider_id;
                req.type = 'service_center';
                req.role = 'service_center';
                next();
            }
            else {
                logger.info(`--- Token belongs to provider ---`);
                logger.info(`--- Verifying token ---`);
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                logger.info(`--- Decoded: ${JSON.stringify(decoded)} ---`);
                const user = await User.findUnique({
                    where: {
                        id: decoded.id
                    }
                }); 
                if (!user) {
                    logger.error(`--- User not found with id: ${decoded.id} ---`);
                    return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
                }
                const provider = await Provider.findFirst({ where: { user_id: user.id } });
                if (provider?.is_blocked) {
                    logger.error(`--- Provider is blocked (id: ${provider.id}) ---`);
                    return returnError(res, StatusCodes.FORBIDDEN, `Your account has been blocked. Please contact support.`);
                }
                req.user_id = user.id;
                req.type = 'provider';
                req.role = 'owner';
                logger.info(`--- User id: ${req.user_id} ---`);
                next();
            }
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }

}

/**
 * Verify token for Super Admin - platform-level admin
 * No franchise required. User must have user_type === "super_admin"
 */
const verifySuperAdminToken = async (req, res, next) => {
    try {
        logger.info(`verifySuperAdminToken`);
        const token = extractToken(req.headers.authorization);
        if (!token) {
            return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findUnique({ where: { id: decoded.id } });
        if (!user) {
            return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
        }
        if (user.user_type !== "super_admin") {
            logger.error(`--- Non-super-admin token blocked. user_id: ${user.id}, type: ${user.user_type} ---`);
            return returnError(res, StatusCodes.FORBIDDEN, "Super Admin access required");
        }
        if (!user.is_active || user.is_blocked || user.is_deleted) {
            return returnError(res, StatusCodes.FORBIDDEN, "Account is inactive");
        }
        req.user_id = user.id;
        req.type = "super_admin";
        req.role = "super_admin";
        logger.info(`--- Super Admin user_id: ${req.user_id} ---`);
        next();
    } catch (error) {
        logger.error(`verifySuperAdminToken error: ${error?.message || error}`);
        return returnError(res, StatusCodes.UNAUTHORIZED, "Invalid or expired token");
    }
};

/**
 * Verify token for customers - simpler version without franchise requirement
 * Used for customer-facing endpoints like get-user, update-user-details, update-email
 */
const verifyCustomerToken = async (req, res, next) => {
    try {
        logger.info(`verifyCustomerToken`);
        logger.info(`--- Fetching token from the request ---`);
        const token = extractToken(req.headers.authorization);
        
        logger.info(`--- Token: ${token} ---`);
        if (!token) {
            logger.info(`--- Token is not provided ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
        }
        
        logger.info(`--- Verifying token ---`);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.info(`--- Decoded: ${JSON.stringify(decoded)} ---`);
        
        const user = await User.findUnique({
            where: {
                id: decoded.id
            }
        }); 
        
        if (!user) {
            logger.error(`--- User not found with id: ${decoded.id} ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
        }
        if (user.user_type !== "customer") {
            logger.error(`--- Non-customer token blocked for customer endpoint. user_id: ${user.id}, type: ${user.user_type} ---`);
            return returnError(res, StatusCodes.FORBIDDEN, "Only customer accounts can access this endpoint");
        }
        
        req.user_id = user.id;
        req.user_type = user.user_type;
        req.role = 'customer';
        logger.info(`--- User id: ${req.user_id}, type: ${req.user_type} ---`);
        next();
    } catch (error) {
        logger.error(`--- Error in verifyCustomerToken: ${error.message} ---`);
        return returnError(res, StatusCodes.UNAUTHORIZED, "Invalid or expired token");
    }
}

const getCurrentRole = (req) => {
    if (req.type === "super_admin") return "super_admin";
    if (req.user_type === "customer") return "customer";
    if (req.type === "provider") return "owner";
    if (req.type === "dealer") return "dealer";
    if (req.type === "staff") return "staff";
    if (req.type === "service_center") return "service_center";
    return null;
};

/**
 * requireRole(allowedRoles) - Use after verifyLoginToken/verifyToken/verifyCustomerToken
 * @param {string[]} allowedRoles - e.g. ["owner", "dealer", "staff", "customer"]
 */
const requireRole = (allowedRoles = []) => {
    const normalized = allowedRoles.map((r) => String(r).toLowerCase());
    return (req, res, next) => {
        const role = getCurrentRole(req);
        if (!role) return returnError(res, StatusCodes.UNAUTHORIZED, "Unauthorized", null);
        if (!normalized.includes(role)) {
            return returnError(res, StatusCodes.FORBIDDEN, `Access denied. Required role: ${normalized.join(" or ")}`, { error_code: "ROLE_FORBIDDEN" });
        }
        req.role = role;
        next();
    };
};

export { verifyToken, verifyStaffToken, verifyLoginToken, verifyCustomerToken, verifySuperAdminToken, requireRole };
export { authorize } from "./authorize.js";