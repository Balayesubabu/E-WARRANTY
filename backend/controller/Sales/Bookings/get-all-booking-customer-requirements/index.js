import {logger,returnError,returnResponse} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getAllBookingCustomerRequirements, getProviderByUserId } from "./query.js";

const getAllBookingCustomerRequirementsEndpoint = async (req, res) => {
    try {
        logger.info(`getAllBookingCustomerRequirementsEndpoint`);
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

        logger.info(`--- Fetching all booking customer requirements ---`);
        const { booking_id } = req.params;

        if(!booking_id){
            logger.error(`--- Booking id is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Booking id is required`);
        }

        const allBookingCustomerRequirements = await getAllBookingCustomerRequirements(booking_id, provider.id, franchise_id);
        if (!allBookingCustomerRequirements || allBookingCustomerRequirements.length === 0) {
            logger.error(`--- No booking customer requirements found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No booking customer requirements found`);
        }
        logger.info(`--- Booking customer requirements fetched ---`);
        return returnResponse(res, StatusCodes.OK, allBookingCustomerRequirements);
    }
    catch (error) {
        logger.error(`Error in getAllBookingCustomerRequirementsEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }   
};
export { getAllBookingCustomerRequirementsEndpoint };