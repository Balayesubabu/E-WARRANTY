import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { getProviderByUserId, getProviderSalesInvoice } from "./query.js";

/**
 * Endpoint to search sales invoices based on query
 */
const searchSalesInvoiceEndpoint = async (req, res) => {
  try {
    logger.info("searchSalesInvoiceEndpoint");

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
    const { search_query } = req.query;

    if (!search_query || search_query.trim() === "") {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "Search query is required"
      );
    }

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    logger.info(
      `--- Provider found for user_id: ${user_id}, fetching invoices ---`
    );
    const allInvoices = await getProviderSalesInvoice(provider.id);

    if (!allInvoices || allInvoices.length === 0) {
      return returnError(res, StatusCodes.NOT_FOUND, "No sales invoices found");
    }

    // Filter invoices by search query (case-insensitive)
    const filteredInvoices = allInvoices.filter((invoice) => {
      const query = search_query.toLowerCase();
      return (
        (invoice.invoice_number &&
          invoice.invoice_number.toLowerCase().includes(query)) ||
        (invoice.provider_customer?.customer_name &&
          invoice.provider_customer.customer_name.toLowerCase().includes(query))
      );
    });

    if (filteredInvoices.length === 0) {
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        "No matching sales invoices found"
      );
    }

    // Aggregate totals
    const total_sales_amount = filteredInvoices.reduce(
      (acc, invoice) => acc + invoice.invoice_total_amount,
      0
    );
    const total_pending_amount = filteredInvoices.reduce(
      (acc, invoice) => acc + invoice.invoice_pending_amount,
      0
    );
    const total_paid_amount = filteredInvoices.reduce(
      (acc, invoice) => acc + invoice.invoice_paid_amount,
      0
    );

    const response = {
      total_sales_amount,
      total_pending_amount,
      total_paid_amount,
      filteredInvoices,
    };

    return returnResponse(
      res,
      StatusCodes.OK,
      "Matching sales invoices found",
      response
    );
  } catch (error) {
    logger.error(`--- Error in searchSalesInvoiceEndpoint: ${error} ---`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Internal server error"
    );
  }
};

export { searchSalesInvoiceEndpoint };
