import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, createLead } from "./query.js";

const createLeadEndpoint = async (req, res) => {
    try {
        logger.info(`createLeadEndpoint`);

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
        } = data;

        logger.info(`--- Creating Lead with data ${JSON.stringify(data)} ---`);
        const lead = await createLead(provider.id, data);
        if (!lead) {
            logger.error(`--- Failed to create lead with data ${JSON.stringify(data)} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create lead");
        }
        logger.info(`--- Lead created with id ${lead.id} with data ${JSON.stringify(data)} ---`);

        return returnResponse(res, StatusCodes.CREATED, "Lead created successfully", lead);
    }
    catch (error) {
        logger.error(`--- Error in createLeadEndpoint ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
    }
}

export default createLeadEndpoint;