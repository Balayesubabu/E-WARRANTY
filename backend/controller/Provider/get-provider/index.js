import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId } from "./query.js";

const getProviderEndpoint = async (req, res) => {
    try {
        logger.info(`GetProviderEndpoint`);
        const user_id = req.user_id;

        logger.info(`--- Getting provider for user id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for user id: ${user_id}`);
        }

        logger.info(`--- Provider found for user id: ${user_id} ---`);

        const module_access = provider.subscriptions.map(subscription => subscription.subscription_plan.modules.map(module => {
            return {
                module_name: module.module.name,
                module_id: module.module.id,
            }
        }));

        return returnResponse(res, StatusCodes.OK, `Provider found for user id: ${user_id}`, {
            provider: provider,
            module_access: module_access
        });

    } catch (error) {
        logger.error(`--- Error in getProviderEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getProviderEndpoint: ${error}`);
    }
}

export { getProviderEndpoint };
