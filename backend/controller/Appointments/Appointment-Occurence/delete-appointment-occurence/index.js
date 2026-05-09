import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getAppointmentById, deleteAppointmentOccurrence, updateAppointment } from "./query.js";

const deleteAppointmentOccurenceEndpoint = async (req, res) => {
    try {
        logger.info(`deleteAppointmentOccurenceEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Checking if provider exists with user_id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found with id ${provider.id} ---`);

        const { appointment_id, occurrence_id } = req.body;

        const appointment = await getAppointmentById(appointment_id, provider.id);
        if (!appointment) {
            logger.error(`--- Appointment not found with id ${appointment_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Appointment not found");
        }
        logger.info(`--- Appointment found with id ${appointment_id} ---`);

        logger.info(`--- Deleting appointment occurrence with id ${occurrence_id} for appointment with id ${appointment_id} ---`);
        const appointmentOccurrence = await deleteAppointmentOccurrence(appointment_id, occurrence_id, provider.id);
        if (!appointmentOccurrence) {
            logger.error(`--- Failed to delete appointment occurrence with id ${occurrence_id} for appointment with id ${appointment_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Appointment occurrence not found");
        }
        logger.info(`--- Appointment occurrence deleted successfully with id ${occurrence_id} for appointment with id ${appointment_id} ---`);

        logger.info(`--- Updating appointment occurrence number_of_occurrences, repeat_interval, occurrence_dates ---`);
        
        // Get the deleted occurrence date for comparison
        const deletedOccurrenceDate = appointmentOccurrence.occurrence_date;
        
        // Filter out the deleted occurrence date from the occurrence_dates array
        const updatedOccurrenceDates = appointment.occurrence_dates.filter(date => {
            // Compare dates by converting both to ISO string for exact comparison
            const dateStr = date.toISOString();
            const deletedDateStr = deletedOccurrenceDate.toISOString();
            return dateStr !== deletedDateStr;
        });
        
        const updated_appointment = await updateAppointment(appointment_id, provider.id, {
            number_of_occurrences: appointment.number_of_occurrences - 1,
            repeat_interval: appointment.repeat_interval,
            occurrence_dates: updatedOccurrenceDates,
        });
        if (!updated_appointment) {
            logger.error(`--- Failed to update appointment occurrence number_of_occurrences, repeat_interval, occurrence_dates ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Appointment not found");
        }
        logger.info(`--- Appointment occurrence updated successfully with id ${appointment_id} ---`);

        return returnResponse(res, StatusCodes.OK, "Appointment occurrence deleted successfully", updated_appointment);
    }
    catch (error) {
        logger.error(`--- Error in deleteAppointmentOccurenceEndpoint ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error", error);
    }
}

export default deleteAppointmentOccurenceEndpoint;