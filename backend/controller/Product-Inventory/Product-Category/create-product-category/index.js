import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, createProductCategory } from "./query.js";

const createProductCategoryEndpoint = async (req, res) => {
    try {
        logger.info(`createProductCategoryEndpoint`);
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

        logger.info(`--- Creating product category ---`);
        const data = req.body;
        const {
            category_name,
            category_description,
        } = data;

        logger.info(`--- Creating product category with data ${JSON.stringify(data)} ---`);
        const product_category = await createProductCategory(data, provider.id);
        if (!product_category) {
            logger.error(`--- Product category not created with data ${JSON.stringify(data)} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Product category not created with data ${JSON.stringify(data)}`);
        }
        logger.info(`--- Product category created with data ${JSON.stringify(product_category)} ---`);

        return returnResponse(res, StatusCodes.CREATED, `Product category created successfully`, product_category);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { createProductCategoryEndpoint };