import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderAppointments } from "./query.js";

const getProviderAppointmentsEndpoint = async (req, res) => {
    try {
        logger.info(`getProviderAppointmentsEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Checking if provider exists with user_id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found with id ${provider.id} ---`);

        logger.info(`--- Fetching appointments for provider with id ${provider.id} ---`);
        const appointments = await getProviderAppointments(provider.id);
        if (!appointments) {
            logger.error(`--- No appointments found for provider with id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "No appointments found");
        }
        logger.info(`--- Appointments fetched successfully for provider with id ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, "Appointments fetched successfully", appointments);
    }
    catch (error) {
        logger.error(`--- Error in getProviderAppointmentsEndpoint ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error", error);
    }
}

export default getProviderAppointmentsEndpoint;