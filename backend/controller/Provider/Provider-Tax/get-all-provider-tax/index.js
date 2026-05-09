import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getAllProviderTax } from "./query.js";

const getAllProviderTaxEndpoint = async (req, res) => {
    try {
        logger.info(`getAllProviderTaxEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        logger.info(`--- Fetching all provider tax for provider_id: ${provider.id} ---`);
        const providerTax = await getAllProviderTax(provider.id);
        if (!providerTax) {
            logger.error(`--- Provider tax not found for provider_id: ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider tax not found`);
        }
        logger.info(`--- Provider tax found for provider_id: ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Provider tax fetched`, providerTax);
    } catch (error) {
        logger.error(`Error in getAllProviderTaxEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getAllProviderTaxEndpoint`);
    }
}

export { getAllProviderTaxEndpoint };