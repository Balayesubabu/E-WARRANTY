import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getProviderCustomerById, getProviderCustomerTransactionsByDate } from "./query.js";
import { StatusCodes } from "http-status-codes";

const getProviderCustomerTransactionsByDateEndpoint = async (req, res) => {
    try {
        logger.info(`getProviderCustomerTransactionsByDateEndpoint`);

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

        const { provider_customer_id, start_date, end_date } = req.query;

        if (!provider_customer_id || !start_date || !end_date) {
            logger.error(`--- Missing provider_customer_id, start_date, or end_date parameter ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Missing provider_customer_id, start_date, or end_date parameter`);
        }

        logger.info(`--- Fetching customer details for provider_customer_id: ${provider_customer_id} ---`);
        const customer = await getProviderCustomerById(provider_customer_id, provider.id);
        if (!customer) {
            logger.error(`--- Customer not found for provider_customer_id: ${provider_customer_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Customer not found`);
        }
        logger.info(`--- Customer found for provider_customer_id: ${provider_customer_id} ---`);

        logger.info(`--- Fetching provider customer transactions by date for provider_customer_id: ${provider_customer_id} ---`);
        const transactions = await getProviderCustomerTransactionsByDate(provider_customer_id, provider.id, start_date, end_date);
        if (!transactions) {
            logger.error(`--- Transactions not found for provider_customer_id: ${provider_customer_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Transactions not found`);
        }
        logger.info(`--- Transactions found for provider_customer_id: ${provider_customer_id} ---`);

        return returnResponse(res, StatusCodes.OK, `Transactions fetched successfully`, transactions);
    } catch (error) {
        logger.error(`Error in getProviderCustomerTransactionsByDateEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getProviderCustomerTransactionsByDateEndpoint`);
    }
};

export default getProviderCustomerTransactionsByDateEndpoint;