import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderDebitNotes,getProviderPurchaseInvoice } from "./query.js";

const getProviderDebitNotesEndpoint = async (req, res) => {
    try {
        logger.info(`getProviderDebitNotesEndpoint`);

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

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        const debit_notes = await getProviderDebitNotes(provider.id, franchise_id);
        if (!debit_notes) {
            logger.error(`--- Debit notes not found for provider_id: ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Debit notes not found`);
        }
        logger.info(`--- Debit notes found for provider_id: ${provider.id} ---`);

        for (let i = 0; i < debit_notes.length; i++) {
            if(debit_notes[i].link_to){
                const getInvoice = await getProviderPurchaseInvoice(debit_notes[i].link_to);
                debit_notes[i].linked_invoice_number = getInvoice ? getInvoice.invoice_number : null;
            }
        }

        logger.info(`--- Debit notes fetched successfully ---`);
        return returnResponse(res, StatusCodes.OK, `Debit notes fetched successfully`, debit_notes);
    } catch (error) {
        logger.error(`Error in getProviderDebitNotesEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getProviderDebitNotesEndpoint: ${error.message}`);
    }
}

export { getProviderDebitNotesEndpoint };