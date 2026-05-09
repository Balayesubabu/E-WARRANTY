import {getProviderByUserId, getSalesSummaryCategoryWise} from './query.js';
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getSalesSummaryCategoryWiseEndpoint = async (req , res) => {
    try {
        logger.info(`get user id`);
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
        const franchise_id = req.franchise_id;
        logger.info(`user id is ${user_id}`);

        logger.info(`--- Fetching provider id from the user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${user_id} ---`);

        const { start_date, end_date} = req.query;
        logger.info(`--- Fetching salesSummaryCategoryWise from the provider id ${provider.id} ---`);
        const salesSummaryCategoryWise = await getSalesSummaryCategoryWise(provider.id, franchise_id, start_date, end_date);
        if (!salesSummaryCategoryWise) {
            logger.error(`---salesSummaryCategoryWise not found provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `salesSummaryCategoryWise not found for provider id ${provider.id}`);
        }
        logger.info(`--- salesSummaryCategoryWise found for provider id ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `salesSummaryCategoryWise fetched successfully`, salesSummaryCategoryWise);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export {getSalesSummaryCategoryWiseEndpoint}