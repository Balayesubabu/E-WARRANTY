import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";;
import { getProviderByUserId, searchPurchaseInvoiceQuery } from "./query.js";

const searchPurchaseInvoiceEndpoint = async (req, res) => {
    try {
        logger.info(`searchPurchaseInvoiceEndpoint`);

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

        logger.info(`--- Getting provider details with user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id : ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with id : ${provider.id} ---`);

        const { search_query } = req.query;

        const invoice_type = req.params.invoice_type;

        logger.info(`--- Searching purchase invoices with search_query : ${search_query} ---`);
        const purchase_invoices = await searchPurchaseInvoiceQuery(search_query, provider.id,  franchise_id, staff_id, invoice_type);

        if (purchase_invoices.length === 0) {
            logger.info(`--- No purchase invoices found with search_query : ${search_query} and provider_id : ${provider.id} ---`);
            return returnResponse(res, StatusCodes.OK, `No purchase invoices found`, []);
        }

        logger.info(`--- Purchase invoices found with search_query : ${search_query} and provider_id : ${provider.id} ---`);
        return returnResponse(res, StatusCodes.OK, `Purchase invoices fetched successfully`, purchase_invoices);
    } catch (error) {
        logger.error(`Error in searchPurchaseInvoiceEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in searchPurchaseInvoiceEndpoint`);
    }
};

export default searchPurchaseInvoiceEndpoint;