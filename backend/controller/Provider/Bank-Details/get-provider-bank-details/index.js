import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderBankDetails } from "./query.js";

const getProviderBankDetailsEndpoint = async (req, res) => {
    try {
        logger.info(`GetProviderBankDetailsEndpoint`);
        const user_id = req.user_id;

        logger.info(`--- Getting provider bank details for user id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for user id: ${user_id}`);
        }
        logger.info(`--- Provider found for user id: ${user_id} ---`);

        const bank_details = await getProviderBankDetails(provider.id);
        if (!bank_details) {
            logger.error(`--- Bank details not found for provider id: ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Bank details not found for provider id: ${provider.id}`);
        }
        logger.info(`--- Bank details found for provider id: ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Bank details found for provider id: ${provider.id}`, bank_details);


    } catch (error) {
        logger.error(`--- Error in getProviderBankDetailsEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getProviderBankDetailsEndpoint: ${error}`);
    }
}

export { getProviderBankDetailsEndpoint };