import { getProviderByUserId, getProviderPaymentOut } from "./query.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getProviderPaymentOutEndpoint = async (req, res) => {
    try {
        logger.info(`getProviderPaymentOutEndpoint`);

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

        logger.info(`--- Fetching provider payment out transactions ---`);
        const paymentOut = await getProviderPaymentOut(provider.id, franchise_id);
        
        if (!paymentOut || paymentOut.length === 0) {
            logger.info(`--- No payment out transactions found for provider ---`);
            return returnResponse(res, StatusCodes.OK, `No payment out transactions found`, []);
        }
        
        logger.info(`--- Found ${paymentOut.length} payment out transactions ---`);

        logger.info(`--- Provider payment out fetched successfully ---`);
        return returnResponse(res, StatusCodes.OK, `Provider payment out fetched successfully`, paymentOut);
    } catch (error) {
        logger.error(`Error in getProviderPaymentOutEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getProviderPaymentOutEndpoint: ${error.message}`);
    }
}

export { getProviderPaymentOutEndpoint };