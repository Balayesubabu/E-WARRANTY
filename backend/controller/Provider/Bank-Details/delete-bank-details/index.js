import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, deleteBankDetails } from "./query.js";

const deleteBankDetailsEndpoint = async (req, res) => {
    try {
        logger.info(`DeleteBankDetailsEndpoint`);
        const user_id = req.user_id;

        logger.info(`--- Getting provider bank details for user id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for user id: ${user_id}`);
        }

        logger.info(`--- Provider found for user id: ${user_id} ---`);

        const bank_detail_id = req.params.bank_detail_id;

        logger.info(`--- Deleting bank details for provider id: ${provider.id} and bank detail id: ${bank_detail_id} ---`);
        const bank_details = await deleteBankDetails(provider.id, bank_detail_id);
        if (!bank_details) {
            logger.error(`--- Bank details not found for provider id: ${provider.id} and bank detail id: ${bank_detail_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Bank details not found for provider id: ${provider.id} and bank detail id: ${bank_detail_id}`);
        }

        logger.info(`--- Bank details deleted for provider id: ${provider.id} and bank detail id: ${bank_detail_id} ---`);
        return returnResponse(res, StatusCodes.OK, `Bank details deleted for provider id: ${provider.id} and bank detail id: ${bank_detail_id}`, bank_details);

    } catch (error) {
        logger.error(`--- Error in deleteBankDetailsEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in deleteBankDetailsEndpoint: ${error}`);
    }
}

export { deleteBankDetailsEndpoint };