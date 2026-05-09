import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getProviderByUserId, getPurchaseInvoiceByDate } from "./query.js";

const getPurchaseInvoiceByDateEndpoint = async (req, res) => {
  try {
    logger.info(`getPurchaseInvoiceByDateEndpoint`);

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
    const invoice_type = req.params.invoice_type;
    logger.info(
      `--- Fetching purchase invoice with start_date: ${start_date} and end_date: ${end_date} ---`
    );

    const purchase_invoice = await getPurchaseInvoiceByDate(
      provider.id,
      franchise_id,
      staff_id,
      start_date,
      end_date,
      invoice_type
    );

    if (!purchase_invoice || purchase_invoice.length === 0) {
      logger.info(
        `--- No purchase invoice found with start_date: ${start_date} and end_date: ${end_date} ---`
      );

      const response = {
        total_purchase_amount: 0,
        total_pending_amount: 0,
        total_paid_amount: 0,
        purchase_invoice: [],
      };

      return returnResponse(
        res,
        StatusCodes.OK,
        "No purchase invoice found in given date range",
        response
      );
    }

    logger.info(
      `--- Purchase invoice with start_date: ${start_date} and end_date: ${end_date} fetched successfully ---`
    );

    // Calculate summary totals
    const total_purchase_amount = purchase_invoice.reduce(
      (acc, invoice) => acc + invoice.invoice_total_amount,
      0
    );
    const total_pending_amount = purchase_invoice.reduce(
      (acc, invoice) => acc + invoice.invoice_pending_amount,
      0
    );
    const total_paid_amount = purchase_invoice.reduce(
      (acc, invoice) => acc + invoice.invoice_paid_amount,
      0
    );

    const response = {
      total_purchase_amount,
      total_pending_amount,
      total_paid_amount,
      purchase_invoice,
    };

    return returnResponse(
      res,
      StatusCodes.OK,
      "Purchase invoice fetched successfully",
      response
    );
  } catch (error) {
    logger.error(`getPurchaseInvoiceByDateEndpoint: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getPurchaseInvoiceByDateEndpoint };
