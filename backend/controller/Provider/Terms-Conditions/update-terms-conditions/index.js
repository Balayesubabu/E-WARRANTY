import { getProviderByUserId, updateProviderTermsConditions } from "./query.js";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const updateTermsConditionsEndpoint = async (req, res) => {
    try {
        logger.info(`updateTermsConditionsEndpoint`);
        const { terms_and_conditions, type, link} = req.body;
        //commented by akash
        // const terms_and_conditions_id = req.query.terms_and_conditions_id;

        const user_id = req.user_id;

        logger.info(`--- Fetching provider with user_id: ${user_id} ---`);

        const provider = await getProviderByUserId(user_id);

        if (!provider) {
            logger.error(`--- Provider not found with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }

        logger.info(`--- Provider found with user_id: ${user_id} ---`);

        logger.info(`--- Updating terms_and_conditions for provider with user_id: ${user_id} ---`);

        // const updated_provider = await updateProviderTermsConditions(provider.id, { terms_and_conditions, type, terms_and_conditions_id });
         const updated_provider = await updateProviderTermsConditions(provider.id, { terms_and_conditions, type, link});
        if (!updated_provider) {
            logger.error(`--- Failed to update terms_and_conditions for provider with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update terms_and_conditions`);
        }

        logger.info(`--- terms_and_conditions updated for provider with user_id: ${user_id} ---`);

        return returnResponse(res, StatusCodes.OK, `terms_and_conditions updated successfully`);

    }
    catch (error) {
        logger.error(`--- Error in updateTermsConditionsEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { updateTermsConditionsEndpoint };