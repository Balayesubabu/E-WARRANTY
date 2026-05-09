import {logger,returnError,returnResponse} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {getProviderByUserId, updateBookingWorkDetails,updateBookingWorkDetailsWithReasssign} from "./query.js";

const updateBookingWorkDetailsEndpoint = async (req, res) => {
    logger.info(`updateBookingWorkDetailsEndpoint`);
    try {
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


   const {
       id,bookingId, booking_part_id, booking_service_id, booking_service_package_id, technicianId, workName,status,is_reassign,remarks
   } = req.body;
   if(status === 'Reassigned'){
    logger.info(`--- Reassigning and updating booking work details ---`);
    const updatedWorkDetails = await updateBookingWorkDetailsWithReasssign(bookingId, booking_part_id, booking_service_id, booking_service_package_id, technicianId, workName,status,is_reassign,remarks,staff_id,provider.id, franchise_id,id);
    if (!updatedWorkDetails) {
        logger.error(`--- Failed to update booking work details ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update booking work details`);
    }
    logger.info(`--- Booking work details updated successfully ---`);
    return returnResponse(res, StatusCodes.OK, updatedWorkDetails);
   }
   else{
    logger.info(`--- Updating booking work details ---`);
    const updatedWorkDetails = await updateBookingWorkDetails(id, bookingId, booking_part_id, booking_service_id, booking_service_package_id, technicianId, workName, status, is_reassign, remarks, provider.id, franchise_id, staff_id);
    if (!updatedWorkDetails) {
        logger.error(`--- Failed to update booking work details ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update booking work details`);
    }
    logger.info(`--- Booking work details updated successfully ---`);
    return returnResponse(res, StatusCodes.OK, updatedWorkDetails);
   }
}   
    catch (error) {
        logger.error(`Error in updateBookingWorkDetailsEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { updateBookingWorkDetailsEndpoint };
