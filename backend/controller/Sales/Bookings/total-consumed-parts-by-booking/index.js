import {logger,returnError,returnResponse} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getTotalConsumedPartsByBooking, getProviderByUserId} from "./query.js";

const getTotalConsumedPartsByBookingEndpoint = async (req, res) => {
    try {
        logger.info(`getTotalConsumedPartsByBookingEndpoint`);
        const { booking_id } = req.params;
        if (!booking_id) {
            logger.error(`--- Booking id is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Booking id is required`);
        }
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
        logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${req.user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${req.user_id} ---`);

        logger.info(`--- Fetching total consumed parts by booking id ${booking_id} ---`);
        const totalConsumedParts = await getTotalConsumedPartsByBooking(booking_id, provider.id, franchise_id);
        if (!totalConsumedParts) {
            logger.error(`--- No consumed parts found for booking id ${booking_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No consumed parts found for booking id ${booking_id}`);
        }
        logger.info(`--- Total consumed parts fetched successfully for booking id ${booking_id} ---`);
        return returnResponse(res, StatusCodes.OK, `Total consumed parts fetched successfully`, totalConsumedParts);
    }
    catch (error) {
        logger.error(`Error in getTotalConsumedPartsByBookingEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getTotalConsumedPartsByBookingEndpoint };