import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getAppointmentOccurrenceById, getAllAppointmentOccurrences } from "./query.js";

const getAppointmentOccurenceEndpoint = async (req, res) => {
    try {
        logger.info(`getAppointmentOccurenceEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Checking if provider exists with user_id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found with id ${provider.id} ---`);

        const { appointment_id, occurrence_id } = req.query;

        // If both appointment_id and occurrence_id are provided, get specific occurrence
        if (appointment_id && occurrence_id) {
            logger.info(`--- Getting appointment occurrence with id ${occurrence_id} for appointment with id ${appointment_id} ---`);
            const appointmentOccurrence = await getAppointmentOccurrenceById(appointment_id, occurrence_id, provider.id);
            if (!appointmentOccurrence) {
                logger.error(`--- Failed to get appointment occurrence with id ${occurrence_id} for appointment with id ${appointment_id} ---`);
                return returnError(res, StatusCodes.NOT_FOUND, "Appointment occurrence not found");
            }
            logger.info(`--- Appointment occurrence found with id ${occurrence_id} for appointment with id ${appointment_id} ---`);

            return returnResponse(res, StatusCodes.OK, "Appointment occurrence found successfully", appointmentOccurrence);
        } else {
            // Get all occurrences for the provider
            logger.info(`--- Getting all appointment occurrences for provider with id ${provider.id} ---`);
            const appointmentOccurrences = await getAllAppointmentOccurrences(provider.id);
            if (!appointmentOccurrences) {
                logger.error(`--- No appointment occurrences found for provider with id ${provider.id} ---`);
                return returnError(res, StatusCodes.NOT_FOUND, "No appointment occurrences found");
            }
            logger.info(`--- Appointment occurrences fetched successfully for provider with id ${provider.id} ---`);

            return returnResponse(res, StatusCodes.OK, "Appointment occurrences fetched successfully", appointmentOccurrences);
        }
    }
    catch (error) {
        logger.error(`--- Error in getAppointmentOccurenceEndpoint ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error", error);
    }
}

export default getAppointmentOccurenceEndpoint;