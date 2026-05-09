import { getProviderByUserId, getHighestExpenseNumberByProviderId } from './query.js';
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

 const getHighestExpenseNumber = async (req, res) => {
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

        logger.info(`--- Fetching highest expense number from the provider id ${provider.id} ---`);
        const highestExpenseNumber = await getHighestExpenseNumberByProviderId(provider.id, franchise_id);
        if (!highestExpenseNumber) {
            logger.error(`---highestExpenseNumber not found with provider id ${provider.id} ---`);
            return returnResponse(res, StatusCodes.OK, `highestExpenseNumber not found with provider id ${provider.id}`, 1);
        }
        logger.info(`--- highestExpenseNumber found with provider id ${provider.id} ---`);
        return returnResponse(res, StatusCodes.OK, `highestExpenseNumber fetched successfully`, {highestExpenseNumber});
    } catch (error) {
        logger.error(error);
       return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

export { getHighestExpenseNumber };