import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../../services/logger.js";
import { deleteBalanceSheetEntry, getProviderByUserId } from "./query.js";

const deleteBalanceSheetEntryEndpoint = async (req, res) => {
    try {
        logger.info(`deleteBalanceSheetEntryEndpoint`);

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
        let franchise_id = req.franchise_id;

        logger.info(`--- Fetching provider by user id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);

        if (!provider) {
            logger.info(`--- Provider not found for user id : ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found with user id : ${user_id} ---`);

        const balance_sheet_entry_id = req.params.balance_sheet_entry_id;

        logger.info(`--- Deleting balance sheet entry with id : ${balance_sheet_entry_id} ---`);
        const balance_sheet_entry = await deleteBalanceSheetEntry(balance_sheet_entry_id);
        if (!balance_sheet_entry) {
            logger.info(`--- Failed to delete balance sheet entry with id : ${balance_sheet_entry_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Balance sheet entry not found");
        }
        logger.info(`--- Balance sheet entry deleted successfully with id : ${balance_sheet_entry_id} ---`);

        return returnResponse(res, StatusCodes.OK, "Balance sheet entry deleted successfully", balance_sheet_entry);
    } catch (error) {
        logger.error(`Error in deleteBalanceSheetEntryEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
    }
}

export { deleteBalanceSheetEntryEndpoint };