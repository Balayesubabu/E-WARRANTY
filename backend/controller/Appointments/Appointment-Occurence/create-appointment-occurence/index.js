import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getAppointmentById, createAppointmentOccurrence, updateAppointment } from "./query.js";

const createAppointmentOccurenceEndpoint = async (req, res) => {
    try {
        logger.info(`createAppointmentOccurenceEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Checking if provider exists with user_id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found with id ${provider.id} ---`);

        const appointment_id = req.params.appointment_id;

        const appointment = await getAppointmentById(appointment_id, provider.id);
        if (!appointment) {
            logger.error(`--- Appointment not found with id ${appointment_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Appointment not found");
        }
        logger.info(`--- Appointment found with id ${appointment_id} ---`);

        const data = req.body;

        const {
            occurrence_date,
            status,
            note,
        } = data;

        logger.info(`--- Creating appointment occurrence for appointment with id ${appointment_id} and data ${JSON.stringify(data)} ---`);

        const appointmentOccurrence = await createAppointmentOccurrence(appointment_id, provider.id, data);
        if (!appointmentOccurrence) {
            logger.error(`--- Failed to create appointment occurrence for appointment with id ${appointment_id} and data ${JSON.stringify(data)} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Appointment occurrence not found");
        }
        logger.info(`--- Appointment occurrence created successfully with id ${appointmentOccurrence.id} ---`);

        logger.info(`--- Updating appointment occurrence number_of_occurrences, repeat_interval, occurrence_dates ---`);
        const updated_appointment = await updateAppointment(appointment_id, provider.id, {
            number_of_occurrences: appointment.number_of_occurrences + 1,
            repeat_interval: appointment.repeat_interval,
            occurrence_dates: [...appointment.occurrence_dates, occurrence_date],
        });
        if (!updated_appointment) {
            logger.error(`--- Failed to update appointment occurrence number_of_occurrences, repeat_interval, occurrence_dates ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Appointment not found");
        }
        logger.info(`--- Appointment occurrence updated successfully with id ${appointment_id} ---`);

        return returnResponse(res, StatusCodes.OK, "Appointment occurrence created successfully", updated_appointment);
    }
    catch (error) {
        logger.error(`--- Error in createAppointmentOccurenceEndpoint ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error", error);
    }
}

export default createAppointmentOccurenceEndpoint;