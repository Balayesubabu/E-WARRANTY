/**
 * Coin Balance Check Middleware
 * 
 * This middleware checks if a provider has enough coins to perform an action.
 * It can be used in two modes:
 * 
 * 1. Pre-check mode (default): Check balance before action, block if insufficient
 * 2. Deduct mode: Check and deduct coins in one step (set deduct=true)
 * 
 * Usage:
 *   router.post("/create-dealer", verifyLoginToken, checkCoinBalance("CREATE_DEALER"), createDealerEndpoint);
 *   router.post("/create-product", verifyLoginToken, checkCoinBalance("ADD_PRODUCT"), createProductEndpoint);
 *   router.post("/generate-codes", verifyLoginToken, checkCoinBalanceWithQuantity("GENERATE_WARRANTY_CODE", "quantity"), generateCodesEndpoint);
 */

import { StatusCodes } from "http-status-codes";
import { logger, returnError } from "../services/logger.js";
import { 
    checkBalance, 
    debitForAction,
    MINIMUM_BALANCE_REQUIRED 
} from "../services/coinService.js";

/**
 * Creates middleware to check coin balance for a specific action
 * @param {string} action - The action type (e.g., "CREATE_DEALER")
 * @param {Object} options - Optional settings
 * @param {boolean} options.deduct - If true, deduct coins immediately (default: false)
 * @param {string} options.descriptionFn - Function to generate description from req
 * @returns {Function} Express middleware
 */
const checkCoinBalance = (action, options = {}) => {
    const { deduct = false, descriptionFn = null } = options;

    return async (req, res, next) => {
        try {
            const provider_id = req.provider_id;

            if (!provider_id) {
                return returnError(res, StatusCodes.UNAUTHORIZED, "Provider ID required");
            }

            // Check balance
            const balanceCheck = await checkBalance(provider_id, action, 1);

            if (!balanceCheck.allowed) {
                logger.warn(`Coin check failed for provider ${provider_id}: ${action}. Current: ${balanceCheck.current}, Required: ${balanceCheck.required}`);
                
                return returnError(
                    res,
                    StatusCodes.PAYMENT_REQUIRED,
                    `Insufficient coins. You need ${balanceCheck.required} coins for this action. Current balance: ${balanceCheck.current}. Minimum required: ${MINIMUM_BALANCE_REQUIRED}.`,
                    {
                        error_code: "INSUFFICIENT_COINS",
                        current_balance: balanceCheck.current,
                        required: balanceCheck.required,
                        minimum_required: MINIMUM_BALANCE_REQUIRED,
                        shortfall: balanceCheck.shortfall,
                        action: action
                    }
                );
            }

            // If deduct mode, deduct coins now
            if (deduct) {
                const description = descriptionFn 
                    ? descriptionFn(req) 
                    : `${action.replace(/_/g, " ").toLowerCase()}`;
                
                try {
                    const debitResult = await debitForAction(provider_id, action, description, 1);
                    req.coinDebitResult = debitResult;
                    logger.info(`Coins debited for ${action}: ${balanceCheck.cost_per_item} coins`);
                } catch (debitError) {
                    logger.error(`Coin debit failed: ${debitError.message}`);
                    return returnError(
                        res,
                        StatusCodes.PAYMENT_REQUIRED,
                        debitError.message,
                        { error_code: "COIN_DEBIT_FAILED" }
                    );
                }
            }

            // Store balance info in request for later use
            req.coinBalance = balanceCheck;
            req.coinAction = action;

            next();
        } catch (error) {
            logger.error(`Coin check middleware error: ${error.message}`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Coin balance check failed");
        }
    };
};

/**
 * Creates middleware to check coin balance with dynamic quantity
 * @param {string} action - The action type
 * @param {string} quantityField - Field name in req.body containing quantity (e.g., "quantity", "count")
 * @param {Object} options - Optional settings
 * @returns {Function} Express middleware
 */
const checkCoinBalanceWithQuantity = (action, quantityField, options = {}) => {
    const { deduct = false, descriptionFn = null } = options;

    return async (req, res, next) => {
        try {
            const provider_id = req.provider_id;
            const quantity = parseInt(req.body[quantityField] || req.query[quantityField] || 1);

            if (!provider_id) {
                return returnError(res, StatusCodes.UNAUTHORIZED, "Provider ID required");
            }

            if (quantity <= 0) {
                return returnError(res, StatusCodes.BAD_REQUEST, "Quantity must be positive");
            }

            // Check balance with quantity
            const balanceCheck = await checkBalance(provider_id, action, quantity);

            if (!balanceCheck.allowed) {
                logger.warn(`Coin check failed for provider ${provider_id}: ${action} x ${quantity}. Current: ${balanceCheck.current}, Required: ${balanceCheck.required}`);
                
                return returnError(
                    res,
                    StatusCodes.PAYMENT_REQUIRED,
                    `Insufficient coins. You need ${balanceCheck.required} coins for ${quantity} ${action.replace(/_/g, " ").toLowerCase()}(s). Current balance: ${balanceCheck.current}.`,
                    {
                        error_code: "INSUFFICIENT_COINS",
                        current_balance: balanceCheck.current,
                        required: balanceCheck.required,
                        minimum_required: MINIMUM_BALANCE_REQUIRED,
                        shortfall: balanceCheck.shortfall,
                        action: action,
                        quantity: quantity,
                        cost_per_item: balanceCheck.cost_per_item
                    }
                );
            }

            // If deduct mode, deduct coins now
            if (deduct) {
                const description = descriptionFn 
                    ? descriptionFn(req) 
                    : `${action.replace(/_/g, " ").toLowerCase()} x ${quantity}`;
                
                try {
                    const debitResult = await debitForAction(provider_id, action, description, quantity);
                    req.coinDebitResult = debitResult;
                    logger.info(`Coins debited for ${action} x ${quantity}: ${balanceCheck.required} coins`);
                } catch (debitError) {
                    logger.error(`Coin debit failed: ${debitError.message}`);
                    return returnError(
                        res,
                        StatusCodes.PAYMENT_REQUIRED,
                        debitError.message,
                        { error_code: "COIN_DEBIT_FAILED" }
                    );
                }
            }

            // Store balance info in request
            req.coinBalance = balanceCheck;
            req.coinAction = action;
            req.coinQuantity = quantity;

            next();
        } catch (error) {
            logger.error(`Coin check middleware error: ${error.message}`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Coin balance check failed");
        }
    };
};

/**
 * Helper function to deduct coins after an action completes successfully
 * Call this in your endpoint after the action succeeds
 * @param {string} provider_id - Provider ID
 * @param {string} action - Action type
 * @param {string} description - Description of what was created
 * @param {number} quantity - Quantity (default 1)
 * @param {Object} options - Optional reference info
 * @returns {Object} Debit result
 */
const deductCoinsAfterAction = async (provider_id, action, description, quantity = 1, options = {}) => {
    try {
        const result = await debitForAction(provider_id, action, description, quantity, options);
        logger.info(`Post-action coin debit: ${action} x ${quantity}`);
        return result;
    } catch (error) {
        logger.error(`Post-action coin debit failed: ${error.message}`);
        throw error;
    }
};

export { 
    checkCoinBalance, 
    checkCoinBalanceWithQuantity,
    deductCoinsAfterAction
};
