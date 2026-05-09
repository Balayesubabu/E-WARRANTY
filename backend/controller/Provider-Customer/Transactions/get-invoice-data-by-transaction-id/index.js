import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getInvoiceDataByTransactionId } from "./query.js";
import { StatusCodes } from "http-status-codes";

const getInvoiceDataByTransactionIdEndpoint = async (req, res) => {
    try {
        logger.info(`getInvoiceDataByTransactionIdEndpoint`);

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

        const { transaction_id } = req.query;

        if (!transaction_id) {
            logger.error(`--- Missing transaction_id parameter ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Missing transaction_id parameter`);
        }

        logger.info(`--- Fetching invoice data for transaction_id: ${transaction_id} ---`);
        const invoice_data = await getInvoiceDataByTransactionId(transaction_id, provider.id);
        if (!invoice_data) {
            logger.error(`--- Invoice data not found for transaction_id: ${transaction_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Invoice data not found`);
        }
        logger.info(`--- Invoice data found for transaction_id: ${transaction_id} ---`);

        return returnResponse(res, StatusCodes.OK, `Invoice data fetched successfully`, invoice_data);
    } catch (error) {
        logger.error(`Error in getInvoiceDataByTransactionIdEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getInvoiceDataByTransactionIdEndpoint`);
    }
};

export default getInvoiceDataByTransactionIdEndpoint;