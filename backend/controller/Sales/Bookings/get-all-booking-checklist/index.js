import {logger, returnError,returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getAllChecksListForBooking } from "./query.js";

const getAllBookingChecklistEndpoint = async (req, res) => {
    try {
        logger.info(`getAllBookingChecklistEndpoint`);
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

        const booking_id  = req.params.booking_id;

        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }

        const checks = await getAllChecksListForBooking(booking_id);
        return returnResponse(res, StatusCodes.OK, checks);
    } catch (error) {
        logger.error(`Error in getAllBookingChecklistEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error");
    }
};
export { getAllBookingChecklistEndpoint };