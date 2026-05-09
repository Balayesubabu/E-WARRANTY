import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderSalesReturn,getProviderSalesInvoiceById } from "./query.js";

const getProviderSalesReturnEndpoint = async (req, res) => {
  try {
    logger.info(`getProviderSalesReturnEndpoint`);

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

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    logger.info(
      `--- Fetching sales return details for provider_id: ${provider.id} ---`
    );
    const sales_return = await getProviderSalesReturn(provider.id, franchise_id);
    if (!sales_return || sales_return.length === 0) {
      logger.error(
        `--- Sales return not found for provider_id: ${provider.id} ---`
      );
      return returnResponse(res, StatusCodes.OK, `Sales return not found`, sales_return);
    }
    logger.info(`--- Sales return found for provider_id: ${provider.id} ---`);

    for(let i = 0; i < sales_return.length; i++) {
      if(sales_return[i].link_to){
        const getInvoice = await getProviderSalesInvoiceById(sales_return[i].link_to);
        if(getInvoice){
          sales_return[i].linked_invoice_number = getInvoice.invoice_number;
        } else {
          sales_return[i].linked_invoice_number = null;
        }
      }
    }

    return returnResponse(
      res,
      StatusCodes.OK,
      `Sales return found`,
      sales_return
    );
  } catch (error) {
    logger.error(`Error in getProviderSalesReturnEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getProviderSalesReturnEndpoint: ${error.message}`
    );
  }
};

export { getProviderSalesReturnEndpoint };
