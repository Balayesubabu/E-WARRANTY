import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderCreditNote,getProviderSalesInvoiceById } from "./query.js";

const getProviderCreditNoteEndpoint = async (req, res) => {
  try {
    logger.info(`getProviderCreditNoteEndpoint`);

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

    const credit_notes = await getProviderCreditNote(provider.id, franchise_id);
    if (!credit_notes || credit_notes.length === 0) {
      logger.error(
        `--- Credit notes not found for provider_id: ${provider.id} ---`
      );
      return returnResponse(res, StatusCodes.OK, `Credit notes not found`, credit_notes);
    }
    logger.info(`--- Credit notes found for provider_id: ${provider.id} ---`);

    for(let i = 0; i < credit_notes.length; i++) {
      if(credit_notes[i].link_to){
        const getInvoice = await getProviderSalesInvoiceById(credit_notes[i].link_to);
        if(getInvoice){
          credit_notes[i].linked_invoice_number = getInvoice.invoice_number;
        } else {
          credit_notes[i].linked_invoice_number = null;
        }
      }
    }

    logger.info(`--- Credit notes fetched successfully ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      `Credit notes fetched successfully`,
      credit_notes
    );
  } catch (error) {
    logger.error(`Error in getProviderCreditNoteEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getProviderCreditNoteEndpoint: ${error.message}`
    );
  }
};

export { getProviderCreditNoteEndpoint };
