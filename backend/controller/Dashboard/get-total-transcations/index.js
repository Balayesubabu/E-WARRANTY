import { getProviderByUserId, getSalesTotalTransactions,getPurchaseTotalTransactions } from "./query.js";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getTotalTransactionsEndPoint = async (req, res) => {
  try {
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
    const SalesTransactions = await getSalesTotalTransactions(provider.id,franchise_id);
    if (!SalesTransactions) {
      logger.error(
        `---Sales transactions not found with provider id ${provider.id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Sales transactions not found with provider id ${provider.id}`
      );
    }
    const PurchaseTransactions = await getPurchaseTotalTransactions(provider.id,franchise_id);
    logger.info(`--- transactions found with provider id ${provider.id} ---`);
    if (!PurchaseTransactions) {
      logger.error(
        `---Purchase transactions not found with provider id ${provider.id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Purchase transactions not found with provider id ${provider.id}`
      );
    }



    let totalGrossAmount;
    let totalPurchaseAmount = 0.0;
    let totalSalesAmount = 0.0;

    totalSalesAmount = SalesTransactions.reduce((sum, item) => {
      return sum + Number(item.invoice_total_amount || 0);
    }, 0);

    totalPurchaseAmount = PurchaseTransactions.reduce((sum, item) => {
      return sum + Number(item.invoice_total_amount || 0);
    }, 0);

    totalGrossAmount = parseFloat(totalSalesAmount).toFixed(2) - parseFloat(totalPurchaseAmount).toFixed(2);

    return returnResponse(
      res,
      StatusCodes.OK,
      `transactions fetched successfully`,
      {"totalGrossAmount": parseFloat(totalGrossAmount.toFixed(2)),"totalSalesAmount":parseFloat(totalSalesAmount.toFixed(2)),"totalPurchaseAmount":parseFloat(totalPurchaseAmount.toFixed(2))}
    );
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getTotalTransactionsEndPoint };
