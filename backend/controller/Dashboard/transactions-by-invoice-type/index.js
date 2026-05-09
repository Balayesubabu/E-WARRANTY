import { getProviderByUserId, transactionsByInvoiceType } from "./query.js";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const transactionsByInvoiceTypeEndPoint = async (req, res) => {
  try {
    logger.info(`transactionsByInvoiceTypeEndPoint`);
    logger.info(`get user id`);
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
    const {startDate,endDate,invoice_type} = req.body;
    logger.info(`user id is ${user_id}`);

    logger.info(`--- Fetching provider id from the user id ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found with user id ${user_id} ---`);
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Provider not found with user id ${req.user_id}`
      );
    }
    logger.info(`--- Provider found with user id ${user_id} ---`);

    logger.info(
      `--- Fetching transactions from the provider id ${provider.id} ---`
    );
    const transactions = await transactionsByInvoiceType(provider.id,franchise_id,startDate,endDate,invoice_type);
    if (!transactions) {
      logger.error(
        `---transactions not found with provider id ${provider.id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `transactions not found with provider id ${provider.id}`
      );
    }
    logger.info(`--- transactions found with provider id ${provider.id} ---`);

    return returnResponse(
      res,
      StatusCodes.OK,
      `transactions fetched successfully`,
      transactions
    );
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { transactionsByInvoiceTypeEndPoint };
