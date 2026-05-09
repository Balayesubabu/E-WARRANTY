import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getLeadById, updateLead } from "./query.js";

const updateLeadEndpoint = async (req, res) => {
    try {
        logger.info(`updateLeadEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Checking if provider exists with user_id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found with id ${provider.id} ---`);

        const lead_id = req.params.lead_id;
        const lead = await getLeadById(provider.id, lead_id);
        if (!lead) {
            logger.error(`--- Lead not found with id ${lead_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Lead not found");
        }
        logger.info(`--- Lead found with id ${lead_id} ---`);

        const lead_data = req.body;

        const {
            title,
            lead_details,
            first_name,
            last_name,
            email,
            mobile_number,
            address,
            city,
            state,
            country,
            pin_code,
            vehicle_number,
            franchise_id,
            franchise_service_id,
            franchise_service_package_id,
            note,
            gst_number,
            status,
            booked_date,
            reminder_1,
            reminder_2,
        } = lead_data;

        const updated_lead = await updateLead(provider.id, lead_id, lead_data);
        if (!updated_lead) {
            logger.error(`--- Failed to update lead with id ${lead_id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update lead");
        }
        logger.info(`--- Lead updated with id ${lead_id} and data ${JSON.stringify(lead_data)} ---`);

        return returnResponse(res, StatusCodes.OK, "Lead updated successfully", updated_lead);
    }
    catch (error) {
        logger.error(`--- Error in updateLeadEndpoint ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error", error);
    }
}

export default updateLeadEndpoint;