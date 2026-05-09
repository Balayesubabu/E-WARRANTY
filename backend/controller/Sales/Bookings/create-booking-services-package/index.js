import { logger,returnError,returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { createBookingServicesPackage, getProviderByUserId, getAllPackagesWithChecksListForBooking,createBookingQualityChecks} from "./query.js";

const createBookingServicesPackageEndpoint = async (req, res) => {
    try {
        logger.info(`createBookingServicesPackageEndpoint`);
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

        logger.info(`--- Creating booking services package ---`);
        const data = req.body.service_package_list;
        const booking_id = req.body.booking_id;
        if(!booking_id){
            logger.error(`--- Booking id is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Booking id is required`);
        }
        if(!data || data.length === 0){
            logger.error(`--- Service package list is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Service package list is required`);
        }
        const newBookingServices = await createBookingServicesPackage(data,booking_id,provider.id,franchise_id,staff_id);
        if (!newBookingServices) {
            logger.error(`--- Booking services package not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking services package not created`);
        }
        logger.info(`--- Booking services package created ---`);

        logger.info(`--- Get all packages for the booking id : ${booking_id} ---`);
        const allPackageswithQualityChecks = await getAllPackagesWithChecksListForBooking(booking_id);
        if (!allPackageswithQualityChecks) {
            logger.error(`--- No packages found for the booking id : ${booking_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No packages found for the booking id : ${booking_id}`);
        }
        console.log(allPackageswithQualityChecks);
        let convertSet = new Set(allPackageswithQualityChecks);
        let convertList = Array.from(convertSet);

        logger.info(`--- Creating booking quality checks for the booking id : ${booking_id} ---`);

        const bookingChecks = await createBookingQualityChecks(booking_id,convertList,provider.id,franchise_id,staff_id);
        if (!bookingChecks) {
            logger.error(`--- Booking quality checks not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking quality checks not created`);
        }
        logger.info(`--- Packages found for the booking id : ${booking_id} ---`);
        return returnResponse(res, StatusCodes.CREATED, newBookingServices, bookingChecks);
    } catch (error) {
        logger.error(`Error in createBookingServicesPackageEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }   
};
export { createBookingServicesPackageEndpoint };
        