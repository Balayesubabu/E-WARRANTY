import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, searchQuotationQuery } from "./query.js";

const searchQuotationEndpoint = async (req, res) => {
    try {
        logger.info(`searchQuotationEndpoint`);

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

        logger.info(`--- Searching quotations with search_query : ${search_query} ---`);
        const quotations = await searchQuotationQuery(search_query, provider.id);

        if (quotations.length === 0) {
            logger.info(`--- No quotations found with search_query : ${search_query} and provider_id : ${provider.id} ---`);
            return returnResponse(res, StatusCodes.OK, `No quotations found`, []);
        }

        logger.info(`--- Quotations found with search_query : ${search_query} and provider_id : ${provider.id} ---`);
        return returnResponse(res, StatusCodes.OK, `Quotations fetched successfully`, quotations);
    } catch (error) {
        logger.error(`Error in searchQuotationEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in searchQuotationEndpoint`);
    }
};

export default searchQuotationEndpoint;