import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderProformaInvoice } from "./query.js";

const getProviderProformaInvoiceEndpoint = async (req, res) => {
  try {
    logger.info(`getProviderProformaInvoiceEndpoint`);

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
      `--- Fetching proforma invoices for provider_id: ${provider.id} ---`
    );
    const proformaInvoices = await getProviderProformaInvoice(provider.id);

    if (!proformaInvoices || proformaInvoices.length === 0) {
      logger.error(
        `--- No proforma invoices found for provider_id: ${provider.id} ---`
      );
      return returnResponse(
        res,
        StatusCodes.OK,
        `No proforma invoices found`,
        proformaInvoices
      );
    }
    logger.info(
      `--- Proforma invoices found for provider_id: ${provider.id} ---`
    );

    return returnResponse(
      res,
      StatusCodes.OK,
      `Proforma invoices fetched successfully`,
      proformaInvoices
    );
  } catch (error) {
    logger.error(`Error in getProviderProformaInvoiceEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getProviderProformaInvoiceEndpoint: ${error.message}`
    );
  }
};

export { getProviderProformaInvoiceEndpoint };
