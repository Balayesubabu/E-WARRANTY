import { getProviderByUserId, getFranchiseInventoryByItemCode } from "./query.js";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";    

const getFranchiseProductByItemCodeEndpoint = async (req, res) => {
    try {
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
        const franchise_id = req.franchise_id
    // Fetch provider
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }

 
    const {item_code} = req.query;
  
    if (!item_code) {
      return returnError(res, StatusCodes.BAD_REQUEST, `item_code is required`);
    }
    // Fetch products
    const products = await getFranchiseInventoryByItemCode(provider.id, item_code, franchise_id);
    if (!products) {
      return returnError(res, StatusCodes.NOT_FOUND, `Products not found`);
    }

    logger.info(`--- Products found for item_code: ${item_code} ---`);

    return returnResponse(res, StatusCodes.OK, `Products found`, products);
    } catch (error) {
        logger.error(`--- Error fetching products for item_code: ${item_code} ---`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error fetching products`);
    }
}

export {  getFranchiseProductByItemCodeEndpoint };