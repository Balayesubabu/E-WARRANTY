import { getProviderByUserId, getDealerByProviderId } from "./query.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getProviderDealerEndpoint = async (req, res) => {
    try {
        logger.info(`getProviderDealerEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider by user id ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with user id: ${user_id} ---`);

        logger.info(`--- Fetching dealer by provider id ---`);
        const dealer = await getDealerByProviderId(provider.id);
        if (!dealer || (Array.isArray(dealer) && dealer.length === 0)) {
            logger.info(`--- No dealers found with provider id: ${provider.id} ---`);
            return returnResponse(res, StatusCodes.OK, `No dealers found`, []);
        }
        logger.info(`--- Dealer found with provider id: ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Dealer fetched successfully`, dealer);
    } catch (error) {
        logger.error(`getProviderDealerEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get provider dealer`);
    }
}

export { getProviderDealerEndpoint };