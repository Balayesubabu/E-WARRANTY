import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getProviderByUserId, getProviderProducts,getCategoryName} from "./query.js";
import { StatusCodes } from "http-status-codes";

const getProviderProductsEndpoint = async (req, res) => {
    try {
        logger.info(`getProviderProducts`);
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

        logger.info(`--- Fetching products from the provider id ${provider.id} ---`);
        const products = await getProviderProducts(provider.id);
        if (!products) {
            logger.error(`--- Products not found with provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Products not found with provider id ${provider.id}`);
        }
        logger.info(`--- Products found with provider id ${provider.id} ---`);

        logger.error(`--- category name with provider id ${provider.id} ---`);
        const updatedProducts = await Promise.all(
            products.map(async (prd) => {
              if (prd.category_id) {
                const categoryName = await getCategoryName(provider.id, prd.category_id);
                console.log(categoryName);
                if(categoryName){
                prd.categoryName = categoryName.category_name;
                }
                else{
                    prd.categoryName = '';
                }
              } else {
                prd.categoryName = '';
              }
              return prd;
            })
          );
        
        return returnResponse(res, StatusCodes.OK, `Products fetched successfully`, updatedProducts);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getProviderProductsEndpoint };