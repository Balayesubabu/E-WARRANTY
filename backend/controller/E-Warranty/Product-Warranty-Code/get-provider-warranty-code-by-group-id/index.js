import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getProviderWarrantyCodeByGroupId } from "./query.js";
import { StatusCodes } from "http-status-codes";

const getProviderWarrantyCodeByGroupIdEndpoint = async (req, res) => {
    try {
        logger.info(`getProviderWarrantyCodeByGroupIdEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        logger.info(`--- Fetching warranty code by provider_id: ${provider.id} ---`);
        const warranty_code = await getProviderWarrantyCodeByGroupId(provider.id);
        if (!warranty_code) {
            logger.error(`--- Warranty code not found for provider_id: ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Warranty code not found`);
        }
        logger.info(`--- Warranty code found for provider_id: ${provider.id} ---`);
        const uniqueWarrantyCodes = Object.entries(warranty_code).map(([groupId, items]) => ({
            groupId,
            items
          }));

        return returnResponse(res, StatusCodes.OK, `Warranty code fetched successfully`, uniqueWarrantyCodes);
    } catch (error) {
        logger.error(`Error in getProviderWarrantyCodeByGroupIdEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getProviderWarrantyCodeByGroupIdEndpoint`);
    }
};

export default getProviderWarrantyCodeByGroupIdEndpoint;