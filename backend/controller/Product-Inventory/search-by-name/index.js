import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, searchByProductName } from "./query.js";

const searchByProductNameEndpoint = async (req, res) => {
    try {
        logger.info(`searchByProductNameEndpoint`);
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
        const franchise_id = req.franchise_id;  
        logger.info(`--- Fetching provider by user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found", null);
        }
        logger.info(`--- Provider found ---`);

        // const product_name = req.body.product_name;
        const { search_term} = req.body;

        logger.info(`--- Searching for product by name : ${search_term} ---`);
        const product = await searchByProductName(search_term, provider.id,franchise_id);
        if (!product) {
            logger.error(`--- Product not found ---`);
            return returnResponse(res, StatusCodes.NOT_FOUND, "Product not found", null);
        }
        logger.info(`--- Product found ---`);

        logger.info(`--- Product found ---`);
        return returnResponse(res, StatusCodes.OK, "Product found", product);
    } catch (error) {
        logger.error(`searchByProductNameEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to search by product name`);
    }
}

export { searchByProductNameEndpoint };