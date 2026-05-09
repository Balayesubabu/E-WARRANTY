import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderTaxByType } from "./query.js";

const getProviderTaxByTypeEndpoint = async (req, res) => {
    try {
        logger.info(`getProviderTaxByTypeEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        const data = req.body;

        const {
            tax_type
        } = data;

        if (tax_type !== "GST" && tax_type !== "TCS" && tax_type !== "TDS") {
            logger.error(`--- Invalid tax type ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Invalid tax type`);
        }

        logger.info(`--- Fetching provider tax by type for provider_id: ${provider.id} ---`);
        const providerTax = await getProviderTaxByType(provider.id, tax_type);
        if (!providerTax) {
            logger.error(`--- Provider tax not found for provider_id: ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider tax not found`);
        }
        logger.info(`--- Provider tax found for provider_id: ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Provider tax fetched`, providerTax);
    } catch (error) {
        logger.error(`Error in getProviderTaxByTypeEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getProviderTaxByTypeEndpoint`);
    }
}

export { getProviderTaxByTypeEndpoint };