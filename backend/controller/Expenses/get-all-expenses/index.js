import { getProviderByUserId, getExpensesByProviderId } from "./query.js";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getAllExpensesEndpoint = async (req, res) => {
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
        logger.info(`--- Provider ${provider.id} found with user id ${user_id} ---`);

        logger.info(`--- Fetching expenses from the provider id ${provider.id} ---`);
        const expenses = await getExpensesByProviderId(provider.id, franchise_id);
        if (!expenses) {
            logger.error(`--- Expenses not found with provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Expenses not found with provider id ${provider.id}`);
        }
        logger.info(`--- Expenses found with provider id ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Expenses fetched successfully`, expenses);
    } catch (error) {       
       return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
    }
};

export { getAllExpensesEndpoint };