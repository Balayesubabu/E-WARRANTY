import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, updateBankDetails } from "./query.js";

const updateBankDetailsEndpoint = async (req, res) => {
    try {
        logger.info(`UpdateBankDetailsEndpoint`);
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

        logger.info(`--- Getting provider bank details for user id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for user id: ${user_id}`);
        }
        logger.info(`--- Provider found for user id: ${user_id} ---`);

        const data = req.body;
        const bank_detail_id = req.params.bank_detail_id;
        let {
            bank_name,
            bank_account_number,
            bank_ifsc_code,
            bank_branch_name,
            bank_account_holder_name,
            bank_account_holder_address,
            bank_account_holder_email,
            bank_account_holder_phone,
            is_primary,
            is_active,
            is_deleted,
            deleted_at,
        } = data;

        if (is_deleted) {
            is_active = false;
            deleted_at = new Date();
        }

        logger.info(`--- Updating bank details for provider id: ${provider.id} ---`);
        const bank_details = await updateBankDetails(provider.id, bank_detail_id, data, is_active, is_deleted, deleted_at);
        if (!bank_details) {
            logger.error(`--- Bank details not found for provider id: ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Bank details not found for provider id: ${provider.id}`);
        }
        logger.info(`--- Bank details updated for provider id: ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Bank details updated for provider id: ${provider.id}`, bank_details);

    } catch (error) {
        logger.error(`--- Error in updateBankDetailsEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updateBankDetailsEndpoint: ${error}`);
    }
}

export { updateBankDetailsEndpoint };