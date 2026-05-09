import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, updateAppointment } from "./query.js";

const updateAppointmentEndpoint = async (req, res) => {
    try {
        logger.info(`updateAppointmentEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Checking if provider exists with user_id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found with id ${provider.id} ---`);

        const appointment_id = req.params.appointment_id;

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
            start_date,
            end_date,
            reminder_1,
            reminder_2,     
        } = data;

        logger.info(`--- Updating appointment with id ${appointment_id} and data ${JSON.stringify(data)} ---`);

        const appointment = await updateAppointment(appointment_id, provider.id, data);
        if (!appointment) {
            logger.error(`--- Failed to update appointment with id ${appointment_id} and data ${JSON.stringify(data)} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Appointment not found");
        }
        logger.info(`--- Appointment updated successfully with id ${appointment_id} ---`);

        return returnResponse(res, StatusCodes.OK, "Appointment updated successfully", appointment);
    }
    catch (error) {
        logger.error(`--- Error in updateAppointmentEndpoint ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error", error);
    }
}

export default updateAppointmentEndpoint;