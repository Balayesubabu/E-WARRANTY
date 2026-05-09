import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getProviderByUserId, getTransactionsByType } from "./query.js";
import { StatusCodes } from "http-status-codes";

const getTransactionsTotalByTypeEndpoint = async (req, res) => {
    try {
        logger.info(`getTransactionsTotalByTypeEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        const { type } = req.query;
        if (!type || type !== "Online" || type !== "Cash" || type !== "All") {
            logger.error(`--- Missing type parameter ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Missing type parameter`);
        }

        logger.info(`--- Fetching transactions total by type: ${type} ---`);
        const transactions = await getTransactionsByType(provider.id, type);
        if (!transactions) {
            logger.error(`--- Transactions not found for type: ${type} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Transactions not found`);
        }
        logger.info(`--- Transactions found for type: ${type} ---`);

        const total_online_transactions_amount = transactions.filter(transaction => transaction.transaction_type === "Online").reduce((acc, transaction) => acc + transaction.amount, 0);
        const total_offline_transactions_amount = transactions.filter(transaction => transaction.transaction_type === "Cash").reduce((acc, transaction) => acc + transaction.amount, 0);

        return returnResponse(res, StatusCodes.OK, `Transactions total by type fetched successfully`, {
            total_online_transactions_amount,
            total_offline_transactions_amount
        });
    } catch (error) {
        logger.error(`Error in getTransactionsTotalByTypeEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getTransactionsTotalByTypeEndpoint`);
    }
};

export default getTransactionsTotalByTypeEndpoint;