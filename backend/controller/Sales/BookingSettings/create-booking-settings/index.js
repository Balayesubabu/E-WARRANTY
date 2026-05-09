import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, createOrUpdateBookingSettings } from "./query.js";

const createBookingSettingsEndpoint = async (req, res) => {
    try {
        logger.info(`createBookingSettingsEndpoint`);

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

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        const data = req.body;
        logger.info(`--- Creating booking settings ---`);
        const createdBookingSettings = await createOrUpdateBookingSettings(data, provider.id, franchise_id, staff_id);
        if (!createdBookingSettings) {
            logger.error(`--- Booking settings creation failed ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking settings creation failed`);
        }

        logger.info(`--- Booking settings created successfully ---`);
        return returnResponse(res, StatusCodes.CREATED, `Booking settings created successfully`, createdBookingSettings);
    } catch (error) {
        logger.error(`createBookingSettingsEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create booking settings`);
    }
}

export { createBookingSettingsEndpoint };