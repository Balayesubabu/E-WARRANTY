import {logger,returnError,returnResponse} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getAllBookingTechnicians, getProviderByUserId } from "./query.js";

const getAllBookingTechniciansEndpoint = async (req, res) => {
    try {
        logger.info(`getAllBookingTechniciansEndpoint`);
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

        logger.info(`--- Fetching all booking technicians ---`);
        const { booking_id } = req.params;

        if (!booking_id) {
            logger.error(`--- Booking id is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Booking id is required`);
        }

        const allBookingTechnicians = await getAllBookingTechnicians(booking_id, provider.id, franchise_id);

        if (!allBookingTechnicians) {
            logger.error(`--- No booking technicians found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No booking technicians found`);
        }

        logger.info(`--- Booking technicians fetched ---`);

        return returnResponse(res, StatusCodes.OK, allBookingTechnicians);
    } catch (error) {
        logger.error(`Error in getAllBookingTechniciansEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }

};
export { getAllBookingTechniciansEndpoint };