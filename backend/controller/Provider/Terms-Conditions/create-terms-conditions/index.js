import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, createTermsConditions } from "./query.js";

const createTermsConditionsEndpoint = async (req, res) => {
    try {
        logger.info(`createTermsConditionsEndpoint`);
        const user_id = req.user_id;

        logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${req.user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${req.user_id} ---`);

        logger.info(`--- Creating terms conditions ---`);
        const data = req.body;

        const {
            type,
            terms_and_conditions,
            link
        } = data;

        logger.info(`--- Creating terms conditions with data ${JSON.stringify(data)} ---`);
        const terms_conditions = await createTermsConditions(provider.id, type, terms_and_conditions,link);
        if (!terms_conditions) {
            logger.error(`--- Terms conditions not created with data ${JSON.stringify(data)} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Terms conditions not created with data ${JSON.stringify(data)}`);
        }
        logger.info(`--- Terms conditions created with data ${JSON.stringify(terms_conditions)} ---`);

        return returnResponse(res, StatusCodes.CREATED, `Terms conditions created successfully`, terms_conditions);

    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { createTermsConditionsEndpoint };