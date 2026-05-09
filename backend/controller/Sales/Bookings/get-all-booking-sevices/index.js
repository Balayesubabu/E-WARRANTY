import { logger,returnError,returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getAllBookingServices, getProviderByUserId } from "./query.js";

const getAllBookingServicesEndpoint = async (req, res) => {
    try {
        logger.info(`getAllBookingServicesEndpoint`);
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
        const booking_id = req.params.booking_id;

        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }

        const bookingServices = await getAllBookingServices(booking_id, provider.id, franchise_id);
        return returnResponse(res, StatusCodes.OK, bookingServices);
    } catch (error) {
        logger.error(`Error in getAllBookingServicesEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching booking services");
    }
};

export { getAllBookingServicesEndpoint };