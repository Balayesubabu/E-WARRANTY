import {logger,returnError,returnResponse} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { createBookingWorkDetails, getProviderByUserId } from "./query.js";

const createBookingWorkDetailsEndpoint = async (req, res) => {
    try {
        logger.info(`createBookingWorkDetailsEndpoint`);
        let user_id;
        let staff_id;
        ({ user_id, staff_id } = req.body);
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

        const {bookingId, booking_part_id, booking_service_id, booking_service_package_id, technicianId, workName} = req.body;

        if(!bookingId || !technicianId || !workName){
            logger.error(`--- bookingId, technicianId and workName are required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `bookingId, technicianId and workName are required`);
        }
        logger.info(`--- Creating booking work details ---`);
        const newWorkDetails = await createBookingWorkDetails(bookingId, booking_part_id, booking_service_id, booking_service_package_id, technicianId, workName, provider.id, franchise_id, staff_id);
        if (!newWorkDetails) {
            logger.error(`--- Failed to create booking work details ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create booking work details`);
        }
        logger.info(`--- Booking work details created successfully ---`);
        return returnResponse(res, StatusCodes.CREATED, newWorkDetails);
    }
    catch (error) {
        logger.error(`Error in createBookingWorkDetailsEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { createBookingWorkDetailsEndpoint };