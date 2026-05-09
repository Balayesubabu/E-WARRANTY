import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, deleteAppointment } from "./query.js";

const deleteAppointmentEndpoint = async (req, res) => {
    try {
        logger.info(`deleteAppointmentEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Checking if provider exists with user_id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found with id ${provider.id} ---`);

        const appointment_id = req.params.appointment_id;

        logger.info(`--- Deleting appointment with id ${appointment_id} ---`);
        const appointment = await deleteAppointment(appointment_id, provider.id);
        if (!appointment) {
            logger.error(`--- Failed to delete appointment with id ${appointment_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Appointment not found");
        }
        logger.info(`--- Appointment deleted successfully with id ${appointment_id} ---`);

        return returnResponse(res, StatusCodes.OK, "Appointment deleted successfully", appointment);
    }
    catch (error) {
        logger.error(`--- Error in deleteAppointmentEndpoint ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error", error);
    }
}

export default deleteAppointmentEndpoint;