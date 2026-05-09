import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  getPaymentInById,
  deleteProviderPaymentInById,
  updateSalesInvoice,
  updateCustomerFinalBalance,
} from "./query.js";

const deleteProviderPaymentInByIdEndpoint = async (req, res) => {
  try {
    logger.info(`deleteProviderPaymentInByIdEndpoint`);

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
    const { id } = req.params; // this is the payment transaction id
    logger.info(`Deleting paymentIn with id: ${id}`);

    if (!id) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `PaymentIn id is required`
      );
    }

    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }

    const paymentIn = await getPaymentInById(id);
    if (!paymentIn) {
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `PaymentIn not found with id: ${id}`
      );
    }

    // delete the payment transaction
    await deleteProviderPaymentInById(id);

    let tds_amount = paymentIn.sales_invoice.invoice_tds_amount
    let tds_percentage = paymentIn.sales_invoice.invoice_tds_percentage
    if(paymentIn.tds_percentage > 0){
      tds_amount = 0
      tds_percentage = 0
    }


    // update invoice amounts
    await updateSalesInvoice(paymentIn.sales_invoice_id, {
      invoice_pending_amount:
        paymentIn.sales_invoice.invoice_pending_amount + paymentIn.amount +
        paymentIn.tds_amount,
      invoice_paid_amount:
        paymentIn.sales_invoice.invoice_paid_amount - paymentIn.amount,
      is_invoice_fully_paid: false,
      invoice_payment_status: "Pending",
        invoice_tds_percentage: tds_percentage,
        invoice_tds_amount: tds_amount,
        total_amount_payable: paymentIn.sales_invoice.invoice_pending_amount + paymentIn.amount +
        paymentIn.tds_amount
    });

    // update customer balance
    await updateCustomerFinalBalance(
      paymentIn.sales_invoice.provider_customer_id,
      {
        customer_final_balance:
          paymentIn.sales_invoice.provider_customer.customer_final_balance -
          paymentIn.amount,
      }
    );

    return returnResponse(
      res,
      StatusCodes.OK,
      `PaymentIn deleted successfully`,
      { id }
    );
  } catch (error) {
    logger.error(`Error in deleteProviderPaymentInByIdEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in deleteProviderPaymentInByIdEndpoint`
    );
  }
};

export { deleteProviderPaymentInByIdEndpoint };
