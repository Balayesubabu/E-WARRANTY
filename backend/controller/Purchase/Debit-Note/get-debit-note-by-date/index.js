import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getDebitNotesByDate } from "./query.js";

const getDebitNoteByDateEndpoint = async (req, res) => {
    try {
        logger.info(`getDebitNoteByDateEndpoint`);

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

        const { start_date, end_date } = req.query;

        // Validate required query parameters
        if (!start_date) {
            return returnError(res, StatusCodes.BAD_REQUEST, "start_date is required");
        }
        if (!end_date) {
            return returnError(res, StatusCodes.BAD_REQUEST, "end_date is required");
        }

        // Validate and parse dates (support both YYYY-MM-DD and ISO format)
        let startDate, endDate;
        
        try {
            // Try parsing as ISO date first
            startDate = new Date(start_date);
            endDate = new Date(end_date);
            
            // Check if dates are valid
            if (isNaN(startDate.getTime())) {
                return returnError(res, StatusCodes.BAD_REQUEST, "start_date must be a valid date");
            }
            if (isNaN(endDate.getTime())) {
                return returnError(res, StatusCodes.BAD_REQUEST, "end_date must be a valid date");
            }
        } catch (error) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Invalid date format");
        }

        // Validate date range
        if (startDate > endDate) {
            return returnError(res, StatusCodes.BAD_REQUEST, "start_date cannot be greater than end_date");
        }

        // Set time to start and end of day for consistent filtering
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        logger.info(`--- Fetching debit notes from ${startDate.toISOString()} to ${endDate.toISOString()} ---`);
        const debit_notes = await getDebitNotesByDate(provider.id, franchise_id, staff_id, startDate, endDate);
        
        if (!debit_notes || debit_notes.length === 0) {
            logger.info(`--- No debit notes found for the specified date range ---`);
            return returnResponse(res, StatusCodes.OK, "No debit notes found for the specified date range", []);
        }
        
        logger.info(`--- Found ${debit_notes.length} debit notes for the specified date range ---`);

        logger.info(`--- Debit notes fetched successfully ---`);
        return returnResponse(res, StatusCodes.OK, `Debit notes fetched successfully`, debit_notes);
    } catch (error) {
        logger.error(`Error in getDebitNoteByDateEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getDebitNoteByDateEndpoint: ${error.message}`);
    }
}

export { getDebitNoteByDateEndpoint };