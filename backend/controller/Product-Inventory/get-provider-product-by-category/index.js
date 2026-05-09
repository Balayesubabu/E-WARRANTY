import { getProviderByUserId, getProductsByCategoryId } from "./query.js";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getProviderProductByCategory = async (req, res) => {
    try {
        logger.info(`getProviderProductByCategory`);
        const { category_id } = req.params;
        let user_id;
        let staff_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
            staff_id = req.staff_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
            staff_id = null;
        }

        logger.info(`--- Fetching provider with user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with user_id: ${user_id} ---`);

        logger.info(`--- Fetching products with category_id: ${category_id} ---`);
        const products = await getProductsByCategoryId(category_id, provider.id);
        if (!products) {
            logger.error(`--- Products not found with category_id: ${category_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Products not found`);
        }
        logger.info(`--- Products found with category_id: ${category_id} ---`);

        logger.info(`--- Returning products ---`);
        return returnResponse(res, StatusCodes.OK, `Products fetched successfully`, products);
    }
    catch (error) {
        logger.error(`Error in getProviderProductByCategory: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getProviderProductByCategory`);
    }
}

export { getProviderProductByCategory };