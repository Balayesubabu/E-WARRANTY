import { getProviderByUserId, getTermsConditions } from "./query.js";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getTermsConditionsEndpoint = async (req, res) => {
    try {
        logger.info(`getTermsConditionsEndpoint`);
        const user_id = req.user_id;

        logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${req.user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${req.user_id} ---`);

        logger.info(`--- Fetching terms conditions from the provider id ${provider.id} ---`);
        const terms_conditions = await getTermsConditions(provider.id);
        if (!terms_conditions) {
            logger.error(`--- Terms conditions not found with provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Terms conditions not found with provider id ${provider.id}`);
        }
        logger.info(`--- Terms conditions found with provider id ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Terms conditions fetched successfully`, terms_conditions);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getTermsConditionsEndpoint };