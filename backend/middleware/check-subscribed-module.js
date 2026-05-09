import { logger, returnError } from "../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { Provider } from "../prisma/db-models.js";
// SUBSCRIPTION MODEL (COMMENTED OUT - Using Coins Model Instead)
// import { getSubscribedModules, getTrialPlanModules } from "../controller/Subscription/get-provider-subscribed-modules/query.js";
import { getBalance, MINIMUM_BALANCE_REQUIRED } from "../services/coinService.js";

/**
 * Routes that are always allowed even when coins are low.
 * Users must be able to buy coins and view their balance.
 */
const ALWAYS_ALLOWED_PATHS = [
    "/subscription", // Keep for backwards compatibility
    "/coins",        // Allow all coin-related routes
    "/user/logout",
    "/user/get-user",
    "/user/change-password",
    "/owner/get-or-create-franchise",
];

/**
 * Check if the current request path should bypass coin enforcement.
 * @param {string} path - Request path (lowercase)
 * @returns {boolean}
 */
const isAlwaysAllowedPath = (path) => {
    const normalizedPath = path.toLowerCase();
    return ALWAYS_ALLOWED_PATHS.some(allowed => normalizedPath.includes(allowed));
};

/**
 * Check if the HTTP method is a read-only operation.
 * @param {string} method - HTTP method
 * @returns {boolean}
 */
const isReadOnlyMethod = (method) => {
    const readOnlyMethods = ["GET", "HEAD", "OPTIONS"];
    return readOnlyMethods.includes(method.toUpperCase());
};

/**
 * COINS MODEL MIDDLEWARE
 * 
 * This middleware checks if the provider has enough coins to perform actions.
 * - GET requests are always allowed (read-only)
 * - POST/PUT/DELETE require minimum coin balance (100 coins)
 * - Specific actions require additional coin deduction (handled by checkCoinBalance middleware)
 */
const checkSubscribedModule = async (req, res, next) => {
    try {
        logger.info(`CheckSubscribedModuleMiddleware (Coins Model)`);
        const user_id = req.user_id;
        if (!user_id) {
            return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
        }

        logger.info(`--- Checking if provider exists for user id: ${user_id} ---`);
        const provider = await Provider.findFirst({
            where: { user_id },
        });
        if (!provider) {
            logger.error(`--- Provider not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for user id: ${user_id}`);
        }
        logger.info(`--- Provider found for user id: ${user_id} ---`);

        // Set provider_id for downstream use
        req.provider_id = provider.id;

        // ═══════════════════════════════════════════════════════════════
        // COINS MODEL: Check coin balance instead of subscription
        // ═══════════════════════════════════════════════════════════════
        
        // Get coin balance
        const coinBalance = await getBalance(provider.id);
        
        // Store coin info in request for downstream use
        req.coinBalance = coinBalance.balance;
        req.canPerformActions = coinBalance.can_perform_actions;
        
        // For backwards compatibility, set subscription status based on coins
        req.subscriptionStatus = coinBalance.can_perform_actions ? "active" : "low_balance";
        req.moduleAccess = coinBalance.can_perform_actions 
            ? [{ module_name: "all", module_id: "coins" }] 
            : [];

        const requestPath = req.originalUrl || req.path || "";
        const httpMethod = req.method || "GET";

        // Always allow certain paths
        if (isAlwaysAllowedPath(requestPath)) {
            logger.info(`--- Allowing path (always allowed): ${requestPath} ---`);
            return next();
        }

        // Always allow read-only methods
        if (isReadOnlyMethod(httpMethod)) {
            logger.info(`--- Allowing read-only access: ${httpMethod} ${requestPath} ---`);
            return next();
        }

        // For write operations, check if balance is sufficient
        if (!coinBalance.can_perform_actions) {
            logger.warn(`--- Insufficient coins - blocking ${httpMethod} ${requestPath} for provider ${provider.id}. Balance: ${coinBalance.balance} ---`);
            return returnError(
                res,
                StatusCodes.PAYMENT_REQUIRED,
                `Insufficient coins. You need at least ${MINIMUM_BALANCE_REQUIRED} coins to perform this action. Current balance: ${coinBalance.balance}. Please buy coins to continue.`,
                { 
                    error_code: "INSUFFICIENT_COINS",
                    current_balance: coinBalance.balance,
                    minimum_required: MINIMUM_BALANCE_REQUIRED,
                    shortfall: coinBalance.shortfall,
                    allowed_actions: ["view_data", "buy_coins"]
                }
            );
        }

        next();
    } catch (err) {
        logger.error(`CheckSubscribedModule error: ${err.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Access check failed`);
    }
};

/* ═══════════════════════════════════════════════════════════════
 * SUBSCRIPTION MODEL (COMMENTED OUT - Keeping for reference)
 * ═══════════════════════════════════════════════════════════════
 *
 * const checkSubscribedModule_OLD = async (req, res, next) => {
 *     try {
 *         logger.info(`CheckSubscribedModuleMiddleware`);
 *         const user_id = req.user_id;
 *         if (!user_id) {
 *             return returnError(res, StatusCodes.UNAUTHORIZED, `Unauthorized`);
 *         }
 *
 *         const provider = await Provider.findFirst({
 *             where: { user_id },
 *         });
 *         if (!provider) {
 *             return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
 *         }
 *
 *         const subscribedModules = await getSubscribedModules(provider.id);
 *         const moduleIds = new Set();
 *         const moduleAccess = [];
 *         let subscriptionStatus = "expired";
 *         let trialDaysRemaining = 0;
 *
 *         if (subscribedModules && subscribedModules.length > 0) {
 *             subscriptionStatus = "active";
 *             for (const sub of subscribedModules) {
 *                 const planModules = sub.subscription_plan?.modules || [];
 *                 for (const pm of planModules) {
 *                     if (pm.module && !moduleIds.has(pm.module.id)) {
 *                         moduleIds.add(pm.module.id);
 *                         moduleAccess.push({ module_name: pm.module.name, module_id: pm.module.id });
 *                     }
 *                 }
 *             }
 *         } else {
 *             const now = new Date();
 *             const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
 *             const createdAt = new Date(provider.created_at);
 *             if (createdAt >= sevenDaysAgo) {
 *                 subscriptionStatus = "trial";
 *                 trialDaysRemaining = Math.ceil((createdAt.getTime() + 7 * 24 * 60 * 60 * 1000 - now.getTime()) / (24 * 60 * 60 * 1000));
 *                 const trialModules = await getTrialPlanModules();
 *                 if (trialModules) {
 *                     for (const pm of trialModules) {
 *                         if (pm.module && !moduleIds.has(pm.module.id)) {
 *                             moduleIds.add(pm.module.id);
 *                             moduleAccess.push({ module_name: pm.module.name, module_id: pm.module.id });
 *                         }
 *                     }
 *                 }
 *             }
 *         }
 *
 *         req.moduleAccess = moduleAccess;
 *         req.subscriptionStatus = subscriptionStatus;
 *         req.trialDaysRemaining = trialDaysRemaining;
 *         req.provider_id = provider.id;
 *
 *         if (moduleAccess.length === 0) {
 *             const requestPath = req.originalUrl || req.path || "";
 *             const httpMethod = req.method || "GET";
 *
 *             if (isAlwaysAllowedPath(requestPath)) {
 *                 return next();
 *             }
 *
 *             if (isReadOnlyMethod(httpMethod)) {
 *                 return next();
 *             }
 *
 *             return returnError(
 *                 res,
 *                 StatusCodes.FORBIDDEN,
 *                 `Subscription expired. Please renew to continue using this feature.`,
 *                 { error_code: "SUBSCRIPTION_EXPIRED" }
 *             );
 *         }
 *
 *         next();
 *     } catch (err) {
 *         logger.error(`CheckSubscribedModule error: ${err.message}`);
 *         return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Subscription check failed`);
 *     }
 * };
 */

export { checkSubscribedModule, isReadOnlyMethod, isAlwaysAllowedPath };