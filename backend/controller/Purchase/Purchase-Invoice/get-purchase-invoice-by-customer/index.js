import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getPurchaseInvoiceByCustomer,getInvoiceIdLinkedPurchaseInvoice} from "./query.js";

const getPurchaseInvoiceByCustomerIdEndPoint = async (req, res) => {
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

        logger.info(`get the provider from user id ${user_id}`);

        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${user_id} ---`);

        const provider_customer_id  = req.params.provider_customer_id;
        
        logger.info(`--- Fetching purchase order for customer  ${provider_customer_id} ---`);
        const purchaseinvoice = await getPurchaseInvoiceByCustomer(provider.id, provider_customer_id, franchise_id, staff_id );
        if(!purchaseinvoice ) {
            logger.error(`--- Purchase order not found for customer  ${provider_customer_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Purchase order not found for customer  ${provider_customer_id}`);
        }
        logger.info(`--- Purchase order found for customer  ${provider_customer_id} ---`);

        let purchase_invoice_list = [];
    for (let i = 0; i < purchaseinvoice.length; i++) {
      const purchase_invoice = purchaseinvoice[i].id;
      const result = await getInvoiceIdLinkedPurchaseInvoice(purchase_invoice);
      if(result.length === 0){
        purchaseinvoice[i].is_linked = false;
      }
        else{   
        purchaseinvoice[i].is_linked = true;
      }
    }

        returnResponse(res, StatusCodes.OK, purchaseinvoice);
    } catch (error) {
        logger.error(error);
        returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

export { getPurchaseInvoiceByCustomerIdEndPoint };