import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getProviderByUserId, getTransactionsByType } from "./query.js";
import { StatusCodes } from "http-status-codes";

const getTransactionsByTypeEndpoint = async (req, res) => {
    try {
        logger.info(`getTransactionsByTypeEndpoint`);

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

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        const { type } = req.query;

        if (!type || type !== "Online" || type !== "Cash") {
            logger.error(`--- Missing type parameter ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Missing type parameter`);
        }

        logger.info(`--- Fetching transactions by type: ${type} ---`);
        const transactions = await getTransactionsByType(provider.id, type);
        if (!transactions) {
            logger.error(`--- Transactions not found for type: ${type} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Transactions not found`);
        }
        logger.info(`--- Transactions found for type: ${type} ---`);

        return returnResponse(res, StatusCodes.OK, `Transactions fetched successfully`, transactions);
    } catch (error) {
        logger.error(`Error in getTransactionsByTypeEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getTransactionsByTypeEndpoint`);
    }
};

export default getTransactionsByTypeEndpoint;