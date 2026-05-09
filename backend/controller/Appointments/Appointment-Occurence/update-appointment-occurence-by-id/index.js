import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, updateAppointmentOccurrenceById, getAppointmentById, updateAppointment } from "./query.js";
import { AppointmentOccurrence } from "../../../../prisma/db-models.js";

const updateAppointmentOccurenceByIdEndpoint = async (req, res) => {
    try {
        logger.info(`updateAppointmentOccurenceByIdEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Checking if provider exists with user_id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found with id ${provider.id} ---`);

        const occurrence_id = req.params.occurrence_id;
        const data = req.body;

        const {
            appointment_id,
            status,
            note,
            occurrence_date,
        } = data;

        logger.info(`--- Getting appointment with id ${appointment_id} ---`);
        const appointment = await getAppointmentById(appointment_id, provider.id);
        if (!appointment) {
            logger.error(`--- Appointment not found with id ${appointment_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Appointment not found");
        }
        logger.info(`--- Appointment found with id ${appointment_id} ---`);



        const oldOccurrence = await AppointmentOccurrence.findFirst({
            where: {
                id: occurrence_id,
                appointment_id: appointment_id
            }
        });

        if (!oldOccurrence) {
            logger.error(`--- Appointment occurrence not found with id ${occurrence_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Appointment occurrence not found");
        }

        const oldOccurrenceDate = oldOccurrence.occurrence_date;

        logger.info(`--- Updating appointment occurrence with id ${occurrence_id} for appointment with id ${appointment_id} ---`);
        const appointmentOccurrence = await updateAppointmentOccurrenceById(appointment_id, occurrence_id, provider.id, data);
        if (!appointmentOccurrence) {
            logger.error(`--- Failed to update appointment occurrence with id ${occurrence_id} for appointment with id ${appointment_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Appointment occurrence not found");
        }
        logger.info(`--- Appointment occurrence updated successfully with id ${occurrence_id} for appointment with id ${appointment_id} ---`);

        const updatedOccurrenceDates = appointment.occurrence_dates.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const oldDateStr = oldOccurrenceDate.toISOString().split('T')[0];

            if (dateStr === oldDateStr) {
                return new Date(occurrence_date);
            }
            return date;
        });

        logger.info(`--- Updating appointment occurrence number_of_occurrences, repeat_interval, occurrence_dates ---`);
        const updated_appointment = await updateAppointment(appointment_id, provider.id, {
            number_of_occurrences: appointment.number_of_occurrences,
            repeat_interval: appointment.repeat_interval,
            occurrence_dates: updatedOccurrenceDates,
        });
        logger.info(`--- Appointment occurrence updated successfully with id ${appointment_id} ---`);

        return returnResponse(res, StatusCodes.OK, "Appointment occurrence updated successfully", appointmentOccurrence);
    }
    catch (error) {
        logger.error(`--- Error in updateAppointmentOccurenceByIdEndpoint ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error", error);
    }
}

export default updateAppointmentOccurenceByIdEndpoint;