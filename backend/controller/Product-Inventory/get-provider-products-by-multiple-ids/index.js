import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getProviderByUserId, getProviderProductsByMultipleIdsQuery } from "./query.js";

const getProviderProductsByMultipleIds = async (req, res) => {
    try {
        logger.info(`getProviderProductsByMultipleIds`);

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

        const { product_ids } = req.body;

        logger.info(`--- Getting provider products with multiple ids : ${product_ids} ---`);

        const provider_products = await getProviderProductsByMultipleIdsQuery(product_ids);
        if (!provider_products) {
            logger.error(`--- Provider products not found with multiple ids : ${product_ids} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider products not found`);
        }
        logger.info(`--- Provider products found with multiple ids : ${product_ids} ---`);

        return returnResponse(res, StatusCodes.OK, `Provider products fetched successfully`, provider_products);

    } catch (error) {
        logger.error(`Error in getProviderProductsByMultipleIds: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getProviderProductsByMultipleIds`);
    }
};

export default getProviderProductsByMultipleIds;