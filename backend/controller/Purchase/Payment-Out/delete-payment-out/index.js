import { logger,returnError,returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getPaymentOutById,deleteProviderPaymentOutById,updateCustomerFinalBalance,updatePurchaseInvoice } from "./query.js";  

const deletePaymentOutEndpoint = async (req, res) => {
    logger.info(`deletePaymentOutEndpoint`);
    try {
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
        const { id } = req.params;

        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }

        const paymentOut = await getPaymentOutById(id);
        if (!paymentOut) {
            logger.error(`--- Payment not found for id: ${id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Payment not found`);
        }

        await deleteProviderPaymentOutById(id);

        let tds_amount = paymentOut.purchase_invoice.invoice_tds_amount
    let tds_percentage = paymentOut.purchase_invoice.invoice_tds_percentage
    if(paymentOut.tds_percentage > 0){
      tds_amount = 0
      tds_percentage = 0
    }


    // update invoice amounts
    await updatePurchaseInvoice(paymentOut.purchase_invoice_id, {
      invoice_pending_amount:
        paymentOut.purchase_invoice.invoice_pending_amount + paymentOut.amount +
        paymentOut.purchase_invoice.invoice_tds_amount,
      invoice_paid_amount:
        paymentOut.purchase_invoice.invoice_paid_amount - paymentOut.amount,
      is_invoice_fully_paid: false,
      invoice_payment_status: "Pending",
        invoice_tds_percentage: tds_percentage,
        invoice_tds_amount: tds_amount,
    });

    // update customer balance
    await updateCustomerFinalBalance(
      paymentOut.purchase_invoice.provider_customer_id,
      {
        customer_final_balance:
          paymentOut.purchase_invoice.provider_customer.customer_final_balance +
          paymentOut.amount,
      }
    );
        logger.info(`--- Payment Out deleted successfully for id: ${id} ---`);
        return returnResponse(res, StatusCodes.OK, `Payment Out deleted successfully`);
    } catch (error) {
        logger.error(`Error in deletePaymentOutEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in deletePaymentOutEndpoint`);
    }
};

export default deletePaymentOutEndpoint;