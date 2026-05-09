import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId } from "./query.js";
import { getBalance } from "../../../services/coinService.js";

/**
 * COINS MODEL: Returns provider access based on coin balance
 * - All modules are accessible (coins deducted only for warranty code generation)
 * - Returns coin balance info for frontend display
 */
const getProviderSubscribedModules = async (req, res) => {
    try {
        logger.info(`GetProviderSubscribedModules (Coins Model)`);
        const user_id = req.user_id;

        logger.info(`--- Checking if provider exists for user id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for user id: ${user_id}`);
        }
        logger.info(`--- Provider found for user id: ${user_id} ---`);

        // Get coin balance
        const coinBalance = await getBalance(provider.id);

        // With coins model, all modules are accessible
        // Coins are only deducted when generating warranty codes
        const moduleAccess = [
            {
                id: "coins_all_access",
                name: "Full Access",
                description: "Access to all features (coins deducted for warranty code generation)",
                access_type: "Write",
                SubModule: [],
            }
        ];

        return returnResponse(res, StatusCodes.OK, `Provider access (coins model):`, {
            moduleAccess,
            isTrial: false,
            isCoinsModel: true,
            coinBalance: coinBalance.balance,
            canPerformActions: coinBalance.can_perform_actions,
        });
    } catch (error) {
        logger.error(`Error in getProviderSubscribedModules: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getProviderSubscribedModules: ${error}`);
    }
}

export { getProviderSubscribedModules };