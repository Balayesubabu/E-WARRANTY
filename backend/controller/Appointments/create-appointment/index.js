import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, createAppointment } from "./query.js";

const createAppointmentEndpoint = async (req, res) => {
    try {
        logger.info(`createAppointmentEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Checking if provider exists with user_id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found with id ${provider.id} ---`);

        const data = req.body;
        const {
            provider_id,
            lead_id,
            title,
            appointment_details,
            first_name,
            last_name,
            mobile_number,
            email,
            address,
            vehicle_number,
            gst_number,
            status,
            franchise_id,
            franchise_service_id,
            franchise_service_package_id,
            note,
            number_of_occurrences,
            repeat_interval,
            occurrence_dates,
            start_date,
            end_date,
            reminder_1,
            reminder_2,
        } = data;

        logger.info(`--- Creating appointment for provider with id ${provider.id} and data ${JSON.stringify(data)} ---`);

        const appointment = await createAppointment(provider.id, data);
        if (!appointment) {
            logger.error(`--- Failed to create appointment for provider with id ${provider.id} and data ${JSON.stringify(data)} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create appointment");
        }
        logger.info(`--- Appointment created with id ${appointment.id} and data ${JSON.stringify(data)} ---`);

        return returnResponse(res, StatusCodes.OK, "Appointment created successfully", appointment);
    }
    catch (error) {
        logger.error(`--- Error in createAppointmentEndpoint ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error", error);
    }
}

export default createAppointmentEndpoint;