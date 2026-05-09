import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getCustomerCategory } from "./query.js";

const getCustomerCategoryEndpoint = async (req, res) => {
    try {
        logger.info(`getCustomerCategoryEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider by user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found", null);
        }
        logger.info(`--- Provider found ---`);

        const customer_category = await getCustomerCategory(provider.id);
        if (!customer_category) {
            logger.error(`--- Customer category not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Customer category not found", null);
        }
        logger.info(`--- Customer category found ---`);

        return returnResponse(res, StatusCodes.OK, "Customer category fetched successfully", customer_category);
    } catch (error) {
        logger.error(`--- Error in getCustomerCategoryEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get customer category`);
    }
}

export { getCustomerCategoryEndpoint };