import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { getProviderByUserId, getSalesInvoiceByDate,getInvoiceIdLinkedSalesInvoice } from "./query.js";

const getSalesInvoiceByDateEndpoint = async (req, res) => {
  try {
    logger.info(`getSalesInvoiceByDateEndpoint`);

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

    logger.info(`--- Fetching provider details with user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);

    if (!provider) {
      logger.error(`--- No provider found with user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }
    logger.info(
      `--- Provider with user id ${user_id} fetched successfully ---`
    );

    const { start_date, end_date } = req.query;
    logger.info(
      `--- Fetching sales invoice for provider_id: ${provider.id}, start_date: ${start_date}, end_date: ${end_date} ---`
    );

    const sales_invoice = await getSalesInvoiceByDate(
      provider.id,
      franchise_id,
      start_date,
      end_date
    );

    if (!sales_invoice || sales_invoice.length === 0) {
      logger.info(
        `--- No sales invoice found for provider_id: ${provider.id}, start_date: ${start_date}, end_date: ${end_date} ---`
      );

      const response = {
        total_sales_amount: 0,
        total_pending_amount: 0,
        total_paid_amount: 0,
        sales_invoice: [],
      };

      return returnResponse(
        res,
        StatusCodes.OK,
        "No sales invoice found",
        response
      );
    }

    logger.info(
      `--- Sales invoice fetched successfully for provider_id: ${provider.id} ---`
    );

    for(let i=0;i<sales_invoice.length;i++){
      const sales_invoice_id = sales_invoice[i].id;
      const result = await getInvoiceIdLinkedSalesInvoice(sales_invoice_id);
      if(!result){
        sales_invoice[i].is_linked = false;
        sales_invoice[i].linked_invoice_total_amount = sales_invoice[i].invoice_total_amount;
        sales_invoice[i].linked_invoice_paid_amount = sales_invoice[i].invoice_paid_amount;
        sales_invoice[i].linked_invoice_pending_amount = sales_invoice[i].invoice_pending_amount;
      }
      else{
        sales_invoice[i].is_linked = true;
        sales_invoice[i].linked_invoice_total_amount = sales_invoice[i].invoice_total_amount;
        sales_invoice[i].linked_invoice_paid_amount = result.invoice_total_amount + sales_invoice[i].invoice_paid_amount;
        sales_invoice[i].linked_invoice_pending_amount = sales_invoice[i].invoice_total_amount - (result.invoice_total_amount + sales_invoice[i].invoice_paid_amount);
      }
    }

    // Calculate Totals
    const total_sales_amount = sales_invoice.reduce(
      (acc, invoice) => acc + invoice.linked_invoice_total_amount,
      0
    );
    console.log("total_sales_amount",total_sales_amount);
    const total_pending_amount = sales_invoice.reduce(
      (acc, invoice) => acc + invoice.linked_invoice_pending_amount,
      0
    );
    console.log("total_pending_amount",total_pending_amount);
    const total_paid_amount = sales_invoice.reduce(
      (acc, invoice) => acc + invoice.linked_invoice_paid_amount,
      0
    );
    console.log("total_paid_amount",total_paid_amount);

    const response = {
      total_sales_amount,
      total_pending_amount,
      total_paid_amount,
      sales_invoice,
    };

    return returnResponse(
      res,
      StatusCodes.OK,
      "Sales invoice fetched successfully",
      response
    );
  } catch (error) {
    logger.error(`Error in getSalesInvoiceByDateEndpoint: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getSalesInvoiceByDateEndpoint };
