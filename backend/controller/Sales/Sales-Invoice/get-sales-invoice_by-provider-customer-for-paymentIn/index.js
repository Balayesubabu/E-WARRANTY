import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import {
  getProviderByUserId,
  getProviderSalesInvoiceByCustomer,
  getInvoiceIdLinkedSalesInvoice
} from "./query.js";

const getSalesInvoiceByProviderCustomerForPaymentInEndpoint = async (req, res) => {
  try {
    logger.info(`getSalesInvoiceByProviderCustomerForPaymentInEndpoint`);

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
    const { provider_customer_id } = req.params;

    // --- Verify provider ---
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }

    // --- Fetch Sales Invoice by provider_customer_id ---
    const providerSalesInvoice = await getProviderSalesInvoiceByCustomer(
      provider.id,
      franchise_id,
      provider_customer_id
    );

    if (!providerSalesInvoice || providerSalesInvoice.length === 0) {
      return returnError(res, StatusCodes.NOT_FOUND, `Sales Invoice not found`);
    }
    let sales_invoice_list = [];
    for (let i = 0; i < providerSalesInvoice.length; i++) {
      const sales_invoice = providerSalesInvoice[i].id;
      const result = await getInvoiceIdLinkedSalesInvoice(sales_invoice);
      if(!result){
        providerSalesInvoice[i].is_linked = false;
        providerSalesInvoice[i].linked_invoice_total_amount = 0;
        providerSalesInvoice[i].updated_pending_amount = (providerSalesInvoice[i].invoice_pending_amount).toFixed(2);
      }
      else{
        providerSalesInvoice[i].is_linked = true;
        providerSalesInvoice[i].linked_invoice_id = result.id;
        providerSalesInvoice[i].linked_invoice = result;
        providerSalesInvoice[i].linked_invoice_total_amount = result.invoice_total_amount;
        providerSalesInvoice[i].updated_pending_amount = (providerSalesInvoice[i].invoice_pending_amount - result.invoice_total_amount).toFixed(2);
      }
    }

    

    // --- Send only the invoice list ---
    return returnResponse(
      res,
      StatusCodes.OK,
      `Sales Invoice found`,
      providerSalesInvoice
    );
  } catch (error) {
    logger.error(
      `--- Error in getSalesInvoiceByProviderCustomerEndpoint: ${error} ---`
    );
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Internal server error`
    );
  }
};

export { getSalesInvoiceByProviderCustomerForPaymentInEndpoint };
