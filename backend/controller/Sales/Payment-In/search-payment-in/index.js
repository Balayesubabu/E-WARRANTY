import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, searchPaymentInQuery } from "./query.js";

const searchPaymentInEndpoint = async (req, res) => {
    try {
        logger.info(`searchPaymentInEndpoint`);

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

        logger.info(`--- Searching payment ins with search_query : ${search_query} ---`);
        const payment_ins = await searchPaymentInQuery(search_query, provider.id);

        if (payment_ins.length === 0) {
            logger.info(`--- No payment ins found with search_query : ${search_query} and provider_id : ${provider.id} ---`);
            return returnResponse(res, StatusCodes.OK, `No payment ins found`, []);
        }

        logger.info(`--- Payment ins found with search_query : ${search_query} and provider_id : ${provider.id} ---`);
        return returnResponse(res, StatusCodes.OK, `Payment ins fetched successfully`, payment_ins);
    } catch (error) {
        logger.error(`Error in searchPaymentInEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in searchPaymentInEndpoint`);
    }
};

export default searchPaymentInEndpoint;