import {logger,returnError,returnResponse} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { createBookingParts, getProviderByUserId } from "./query.js";

const createBookingPartsEndpoint = async (req, res) => {
    try {
        logger.info(`createBookingPartsEndpoint`);
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

        logger.info(`--- Creating booking parts ---`);
        const data = req.body.parts_list;
        const booking_id = req.body.booking_id;
        if(!booking_id){
            logger.error(`--- Booking id is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Booking id is required`);
        }
        if(!data || data.length === 0){
            logger.error(`--- Parts list is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Parts list is required`);
        }
        const newBookingParts = await createBookingParts(data,booking_id,provider.id,franchise_id,staff_id);
        if (!newBookingParts) {
            logger.error(`--- Booking parts not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking parts not created`);
        }
        logger.info(`--- Booking parts created ---`);
        return returnResponse(res, StatusCodes.CREATED, newBookingParts);
    }
    catch (error) {
        logger.error(`Error in createBookingPartsEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};
export { createBookingPartsEndpoint };