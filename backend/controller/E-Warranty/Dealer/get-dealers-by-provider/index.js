import { getProviderById, getDealerByProviderId } from "./query.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getDealersByProviderIdEndpoint = async (req, res) => {
    try {
        logger.info(`getDealersByProviderIdEndpoint`);

        const provider_id = req.params.provider_id;

        logger.info(`--- Fetching provider by id ---`);
        const provider = await getProviderById(provider_id);
        if (!provider) {
            logger.error(`--- Provider not found : ${provider_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found : ${provider_id} ---`);

        logger.info(`--- Fetching dealers by provider id ---`);
        const dealers = await getDealerByProviderId(provider.id);
        // Return empty array if no dealers found (not an error)
        logger.info(`--- Found ${dealers ? dealers.length : 0} dealers for provider: ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Dealers fetched successfully`, dealers || []);
    } catch (error) {
        logger.error(`getDealersByProviderIdEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get provider dealers`);
    }
}

export { getDealersByProviderIdEndpoint };