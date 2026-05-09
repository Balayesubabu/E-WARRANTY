import { logger,returnError,returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, createBookingService, getAllServicesWithChecksListForBooking, createBookingQualityChecks} from "./query.js";

const createBookingServicesEndpoint = async (req, res) => {
    try {
        logger.info(`createBookingServicesEndpoint`);
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

        const data = req.body.services_list;
        const booking_id  = req.body.booking_id;

        if(!booking_id){
            logger.error(`--- Booking id is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "Booking id is required");
        }

        if(!data || data.length === 0){
            logger.error(`--- Services list is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "Services list is required");
        }

        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }

        const service = await createBookingService(data, provider.id, franchise_id, staff_id, booking_id);
        if (!service) {
            logger.error(`--- Booking service not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error creating booking service");
        }
        logger.info(`--- Booking service created ---`);
        logger.info(`--- Get all services for the booking id : ${booking_id} ---`);
        const allServiceswithQualityChecks = await getAllServicesWithChecksListForBooking(booking_id);
        if (!allServiceswithQualityChecks) {
            logger.error(`--- No services found for the booking id : ${booking_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No services found for the booking id : ${booking_id}`);
        }
        console.log(allServiceswithQualityChecks);
        let convertSet = new Set(allServiceswithQualityChecks);
        let convertList = Array.from(convertSet);

        logger.info(`--- Creating booking quality checks for the booking id : ${booking_id} ---`);

        const bookingChecks = await createBookingQualityChecks(booking_id,convertList,provider.id,franchise_id,staff_id);
        if (!bookingChecks) {
            logger.error(`--- Booking quality checks not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking quality checks not created`);
        }
        return returnResponse(res, StatusCodes.CREATED, service, bookingChecks);
    } catch (error) {
        logger.error(`Error in createBookingServicesEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error creating booking service");
    }
};
export { createBookingServicesEndpoint };