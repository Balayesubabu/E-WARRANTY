import {logger,returnError,returnResponse} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { createBookingCustomerRequirements, getProviderByUserId } from "./query.js";

const createBookingCustomerRequirementsEndpoint = async (req, res) => {
    try {
        logger.info(`createBookingCustomerRequirementsEndpoint`);
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

        logger.info(`--- Creating booking customer requirements ---`);
        const data = req.body.requirements_list;
        const booking_id = req.body.booking_id;

        if(!booking_id){
            logger.error(`--- Booking id is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Booking id is required`);
        }
        if(!data || data.length === 0){
            logger.error(`--- Requirements list is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Requirements list is required`);
        }

        const newBookingCustomerRequirements = await createBookingCustomerRequirements(data,booking_id,provider.id,franchise_id,staff_id);
        if (!newBookingCustomerRequirements) {
            logger.error(`--- Booking customer requirements not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking customer requirements not created`);
        }
        logger.info(`--- Booking customer requirements created ---`);
        return returnResponse(res, StatusCodes.CREATED, newBookingCustomerRequirements);
    }   
    catch (error) {
        logger.error(`Error in createBookingCustomerRequirementsEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};
export { createBookingCustomerRequirementsEndpoint };