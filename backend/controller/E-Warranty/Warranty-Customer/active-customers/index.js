import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getActiveCustomers } from "./query.js";

const activeCustomersEndpoint = async (req, res) => {
    try {
        logger.info(`activeCustomersEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Getting provider details with user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found ---`);

        // If the request is from a dealer, filter by dealer_id for data isolation
        const dealer_id = req.type === 'dealer' ? req.dealer_id : null;

        logger.info(`--- Getting active customers with provider_id : ${provider.id}${dealer_id ? `, dealer_id : ${dealer_id}` : ''} ---`);
        const active_customers = await getActiveCustomers(provider.id, dealer_id);
        if (!active_customers) {
            logger.error(`--- Active customers not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Active customers not found`);
        }
        logger.info(`--- Active customers found ---`);

        return returnResponse(res, StatusCodes.OK, `Active customers fetched successfully`, active_customers);
    } catch (error) {
        logger.error(`activeCustomersEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get active customers`);
    }
}

export { activeCustomersEndpoint };