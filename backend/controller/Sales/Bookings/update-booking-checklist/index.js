import {logger, returnError,returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {getProviderByUserId, updateBookingChecklist} from "./query.js";

const updateBookingChecklistEndpoint = async (req, res) => {
    try {
        logger.info(`updateBookingChecklistEndpoint`);
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
        const booking_id  = req.body.booking_id;
        const data = req.body.checklist_list;

        if(!booking_id){
            logger.error(`--- Booking id is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "Booking id is required");
        }
        if(!data || data.length === 0){
            logger.error(`--- Checklist list is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "Checklist list is required");
        }

        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        const checklist = await updateBookingChecklist(data, provider.id, franchise_id, staff_id, booking_id);
        if (!checklist) {
            logger.error(`--- Booking checklist not updated ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error updating booking checklist");
        }
        logger.info(`--- Booking checklist updated ---`);
        return returnResponse(res, StatusCodes.OK, "Booking checklist updated", checklist);
    } catch (error) {
        logger.error(`Error in updateBookingChecklistEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error");
    }   

}

export { updateBookingChecklistEndpoint };