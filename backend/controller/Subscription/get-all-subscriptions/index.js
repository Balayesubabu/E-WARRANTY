import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getAllSubscriptions } from "./query.js";

const getAllSubscriptionsEndpoint = async (req, res) => {
    try {
        logger.info(`getAllSubscriptions`);

        logger.info(`--- Fetching all subscriptions ---`);
        const subscriptions = await getAllSubscriptions();
        if (!subscriptions) {
            logger.error(`--- Subscriptions not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Subscriptions not found`);
        }
        logger.info(`--- Subscriptions found with data ${JSON.stringify(subscriptions)} ---`);

        return returnResponse(res, StatusCodes.OK, `Subscriptions fetched successfully`, subscriptions);
    } catch (error) {
        logger.error(`--- Error fetching all subscriptions ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getAllSubscriptionsEndpoint };