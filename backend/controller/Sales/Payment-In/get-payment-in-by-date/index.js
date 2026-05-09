import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getPaymentInByDateQuery } from "./query.js";

const getPaymentInByDateEndpoint = async (req, res) => {
    try {
        logger.info(`getPaymentInByDateEndpoint`);

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

        const { start_date, end_date } = req.query;

        logger.info(`--- Getting payment ins with start_date : ${start_date} and end_date : ${end_date} ---`);
        const payment_ins = await getPaymentInByDateQuery(start_date, end_date, provider.id,franchise_id);

        if (payment_ins.length === 0) {
            logger.info(`--- No payment ins found with start_date : ${start_date} and end_date : ${end_date} and provider_id : ${provider.id} ---`);
            return returnResponse(res, StatusCodes.OK, `No payment ins found`, []);
        }

        logger.info(`--- Payment ins found with start_date : ${start_date} and end_date : ${end_date} and provider_id : ${provider.id} ---`);
        return returnResponse(res, StatusCodes.OK, `Payment ins fetched successfully`, payment_ins);
    } catch (error) {
        logger.error(`Error in getPaymentInByDateEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getPaymentInByDateEndpoint`);
    }
};

export default getPaymentInByDateEndpoint;