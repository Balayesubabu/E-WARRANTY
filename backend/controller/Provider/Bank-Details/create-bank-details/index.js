import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, createBankDetails } from "./query.js";

const createBankDetailsEndpoint = async (req, res) => {
    try {
        logger.info(`CreateBankDetailsEndpoint`);

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

        logger.info(`--- Checking if provider exists for user id: ${user_id} ---`);

        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for user id: ${user_id}`);

        }
        logger.info(`--- Provider found for user id: ${user_id} ---`);

        const data = req.body;

        const {
            bank_name,
            bank_account_number,
            bank_ifsc_code,
            bank_branch_name,
            bank_account_holder_name,
            bank_account_holder_address,
            bank_account_holder_email,
            bank_account_holder_phone,
        } = data;

        let is_primary = false;
        if (provider.ProviderBankDetails.length < 0) {
            is_primary = true;
        }

        logger.info(`--- Creating bank details for provider id: ${provider.id} and user id: ${user_id} and data: ${JSON.stringify(data)} ---`);

        const bank_details = await createBankDetails(provider.id, data, is_primary);
        if (!bank_details) {
            logger.error(`--- Bank details not created for provider id: ${provider.id} and user id: ${user_id} and data: ${JSON.stringify(data)} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Bank details not created for provider id: ${provider.id} and user id: ${user_id} and data: ${JSON.stringify(data)}`);
        }

        logger.info(`--- Bank details created for provider id: ${provider.id} and user id: ${user_id} and data: ${JSON.stringify(data)} ---`);
        return returnResponse(res, StatusCodes.CREATED, `Bank details created for provider`, bank_details);


    } catch (error) {
        logger.error(`--- Error in createBankDetailsEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in createBankDetailsEndpoint: ${error}`);
    }
}

export { createBankDetailsEndpoint };