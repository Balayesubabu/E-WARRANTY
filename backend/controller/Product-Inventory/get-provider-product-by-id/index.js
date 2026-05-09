import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getProviderByUserId, getProductById } from "./query.js";

const getProviderProductByIdEndpoint = async (req, res) => {
    try {
        logger.info(`getProviderProductByIdEndpoint`);

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

        logger.info(`--- Getting provider details with user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id : ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with id : ${provider.id} ---`);

        const product_id = req.params.product_id;

        logger.info(`--- Getting product details with product_id : ${product_id} ---`);
        const product = await getProductById(product_id, provider.id);
        if (!product) {
            logger.error(`--- Product not found with product_id : ${product_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Product not found`);
        }
        logger.info(`--- Product found with id : ${product.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Product fetched successfully`, product);
    } catch (error) {
        logger.error(`Error in getProviderProductByIdEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getProviderProductByIdEndpoint`);
    }
};

export default getProviderProductByIdEndpoint;