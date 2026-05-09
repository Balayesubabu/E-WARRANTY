import {logger,returnError,returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {getProviderByUserId,getAllBooking,getConsumedParts} from "./query.js";

const getAllBookingConsumedPartsEndpoint = async (req, res) => {
    try {
        logger.info(`getAllBookingConsumedPartsEndpoint`);
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

        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`Provider ID: ${provider.id}, Franchise ID: ${franchise_id}`);
        const bookings = await getAllBooking(provider.id,franchise_id);
        if (!bookings || bookings.length === 0) {
            return returnError(res, StatusCodes.NOT_FOUND, "No bookings found");
        }
        logger.info(`Bookings found: ${bookings.length}`);
        for (const booking of bookings) {
            const parts = await getConsumedParts(booking.id, provider.id, franchise_id);
            booking.consumedParts = parts;
            logger.info(`Booking ID: ${booking.id}, Consumed Parts: ${parts.length}`);
        }
        return returnResponse(res, StatusCodes.OK, bookings);
    } catch (error) {
        logger.error(`Error in getAllBookingConsumedPartsEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error");
    }
}

export { getAllBookingConsumedPartsEndpoint };