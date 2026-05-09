import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, searchProformaInvoiceQuery } from "./query.js";

const searchProformaInvoiceEndpoint = async (req, res) => {
    try {
        logger.info(`searchProformaInvoiceEndpoint`);

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

        logger.info(`--- Getting provider details with user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id : ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with id : ${provider.id} ---`);

        const search_query = req.query.search_query;

        logger.info(`--- Searching proforma invoices with search_query : ${search_query} ---`);
        const proforma_invoices = await searchProformaInvoiceQuery(search_query, provider.id);

        if (proforma_invoices.length === 0) {
            logger.info(`--- No proforma invoices found with search_query : ${search_query} and provider_id : ${provider.id} ---`);
            return returnResponse(res, StatusCodes.OK, `No proforma invoices found`, []);
        }

        logger.info(`--- Proforma invoices found with search_query : ${search_query} and provider_id : ${provider.id} ---`);
        return returnResponse(res, StatusCodes.OK, `Proforma invoices fetched successfully`, proforma_invoices);
    } catch (error) {
        logger.error(`Error in searchProformaInvoiceEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in searchProformaInvoiceEndpoint`);
    }
};

export default searchProformaInvoiceEndpoint;