import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, createCustomerCategory } from "./query.js";

const createCustomerCategoryEndpoint = async (req, res) => {
    try {
        logger.info(`createCustomerCategoryEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        logger.info(`--- Creating customer category ---`);
        const data = req.body;
        const {
            customer_category_name,
            customer_category_description,
        } = data;

        logger.info(`--- Creating customer category with data ${JSON.stringify(data)} ---`);
        const customerCategory = await createCustomerCategory(data, provider.id);
        if (!customerCategory) {
            logger.error(`--- Customer category not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Customer category not created`);
        }
        logger.info(`--- Customer category created ---`);
        return returnResponse(res, StatusCodes.OK, `Customer category created`, customerCategory);
    } catch (error) {
        logger.error(`Error in createCustomerCategoryEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in createCustomerCategoryEndpoint: ${error.message}`);
    }
}

export { createCustomerCategoryEndpoint };