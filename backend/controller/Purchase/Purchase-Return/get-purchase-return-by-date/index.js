import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { getProviderByUserId, getPurchaseReturnByDate } from "./query.js";

const getPurchaseReturnByDateEndpoint = async (req, res) => {
  try {
    logger.info(`getPurchaseReturnByDateEndpoint`);

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

    logger.info(`--- Fetching provider details with user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);

    if (!provider) {
      logger.info(`--- No provider found with user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }
    logger.info(
      `--- Provider with user id ${user_id} fetched successfully ---`
    );

    const { start_date, end_date } = req.query;
    logger.info(
      `--- Fetching purchase returns with start_date: ${start_date} and end_date: ${end_date} ---`
    );

    const purchase_returns = await getPurchaseReturnByDate(
      provider.id,
      franchise_id,
      staff_id,
      start_date,
      end_date
    );

    if (!purchase_returns || purchase_returns.length === 0) {
      logger.info(
        `--- No purchase returns found with start_date: ${start_date} and end_date: ${end_date} ---`
      );

      const response = {
        total_return_amount: 0,
        total_pending_amount: 0,
        total_paid_amount: 0,
        purchase_returns: [],
      };

      return returnResponse(
        res,
        StatusCodes.OK,
        "No purchase returns found",
        response
      );
    }

    logger.info(
      `--- Purchase returns with start_date: ${start_date} and end_date: ${end_date} fetched successfully ---`
    );

    // Calculate summary totals
    const total_return_amount = purchase_returns.reduce(
      (acc, invoice) => acc + invoice.invoice_total_amount,
      0
    );
    const total_pending_amount = purchase_returns.reduce(
      (acc, invoice) => acc + invoice.invoice_pending_amount,
      0
    );
    const total_paid_amount = purchase_returns.reduce(
      (acc, invoice) => acc + invoice.invoice_paid_amount,
      0
    );

    const response = {
      total_return_amount,
      total_pending_amount,
      total_paid_amount,
      purchase_returns,
    };

    return returnResponse(
      res,
      StatusCodes.OK,
      "Purchase returns fetched successfully",
      response
    );
  } catch (error) {
    logger.error(`getPurchaseReturnByDateEndpoint: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getPurchaseReturnByDateEndpoint };
