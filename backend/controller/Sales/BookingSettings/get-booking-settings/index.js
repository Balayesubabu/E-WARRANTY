import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getBookingSettings } from "./query.js";

const getBookingSettingsEndpoint = async (req, res) => {
    try {
        logger.info(`getBookingSettingsEndpoint`);
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

        logger.info(`--- Fetching provider by user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        logger.info(`--- Fetching booking settings for provider_id: ${provider.id} and franchise_id: ${franchise_id} ---`);
        const bookingSettings = await getBookingSettings(provider.id, franchise_id);
        console.log(bookingSettings);
        if (!bookingSettings) {
            logger.error(`--- Booking settings not found for provider_id: ${provider.id} and franchise_id: ${franchise_id} ---`);
            return returnResponse(res, StatusCodes.OK, `Booking settings not found`,bookingSettings);
        }
        logger.info(`--- Booking settings found for provider_id: ${provider.id} and franchise_id: ${franchise_id} ---`);        

        return returnResponse(res, StatusCodes.OK, `Booking settings fetched successfully`, bookingSettings);    
    } catch (error) {
        logger.error(`getBookingSettingsEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to fetch booking settings`);     

    }
}

export { getBookingSettingsEndpoint };
