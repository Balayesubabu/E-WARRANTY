import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderProductCategory } from "./query.js";

const getProviderProductCategoryEndpoint = async (req, res) => {
    try {
        logger.info(`getProviderProductCategoryEndpoint`);
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

        logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${req.user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${req.user_id} ---`);

        logger.info(`--- Fetching product categories from the provider id ${provider.id} ---`);
        const product_categories = await getProviderProductCategory(provider.id);
        if (!product_categories) {
            logger.error(`--- Product categories not found with provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Product categories not found with provider id ${provider.id}`);
        }
        logger.info(`--- Product categories found with provider id ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Product categories fetched successfully`, product_categories);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getProviderProductCategoryEndpoint };