import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, searchPurchaseOrderQuery } from "./query.js";

const searchPurchaseOrderEndpoint = async (req, res) => {
    try {
        logger.info(`searchPurchaseOrderEndpoint`);

           let user_id;
    let staff_id;
    if (req.type === "staff") {
      user_id = req.user_id;
      staff_id = req.staff_id;
    } else {
      user_id = req.user_id;
      staff_id = null;
    }

    const franchise_id = req.franchise_id;

        logger.info(`--- Getting provider details with user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);    
        if (!provider) {
            logger.error(`--- Provider not found with user_id : ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with id : ${provider.id} ---`);

        const search_query = req.query.search_query;

        logger.info(`--- Searching purchase orders with search_query : ${search_query} ---`);
        const purchase_orders = await searchPurchaseOrderQuery(search_query, provider.id, staff_id, franchise_id);

        if (purchase_orders.length === 0) {
            logger.info(`--- No purchase orders found with search_query : ${search_query} and provider_id : ${provider.id} ---`);
            return returnResponse(res, StatusCodes.OK, `No purchase orders found`, []);
        }

        logger.info(`--- Purchase orders found with search_query : ${search_query} and provider_id : ${provider.id} ---`);
        return returnResponse(res, StatusCodes.OK, `Purchase orders fetched successfully`, purchase_orders);
    } catch (error) {
        logger.error(`Error in searchPurchaseOrderEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in searchPurchaseOrderEndpoint`);
    }
};

export default searchPurchaseOrderEndpoint;