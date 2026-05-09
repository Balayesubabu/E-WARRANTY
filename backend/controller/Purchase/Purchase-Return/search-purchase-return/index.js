import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, searchPurchaseReturnQuery } from "./query.js";

const searchPurchaseReturnEndpoint = async (req, res) => {
    try {
        logger.info(`searchPurchaseReturnEndpoint`);

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

        const { search_query } = req.query;
        logger.info(`--- Searching purchase returns with search_query : ${search_query} ---`);
        const purchase_returns = await searchPurchaseReturnQuery(search_query, provider.id, staff_id, franchise_id);

        if (purchase_returns.length === 0) {
            logger.info(`--- No purchase returns found with search_query : ${search_query} and provider_id : ${provider.id} ---`);
            return returnResponse(res, StatusCodes.OK, `No purchase returns found`, []);
        }

        logger.info(`--- Purchase returns found with search_query : ${search_query} and provider_id : ${provider.id} ---`);
        return returnResponse(res, StatusCodes.OK, `Purchase returns fetched successfully`, purchase_returns);
    } catch (error) {
        logger.error(`Error in searchPurchaseReturnEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in searchPurchaseReturnEndpoint`);
    }
};

export default searchPurchaseReturnEndpoint;