import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getLeadById, deleteLead } from "./query.js";

const deleteLeadEndpoint = async (req, res) => {
    try {
        logger.info(`deleteLeadEndpoint`);

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

        const deleted_lead = await deleteLead(provider.id, lead_id);
        if (!deleted_lead) {
            logger.error(`--- Failed to delete lead with id ${lead_id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete lead");
        }
        logger.info(`--- Lead deleted with id ${lead_id} ---`);

        return returnResponse(res, StatusCodes.OK, "Lead deleted successfully", deleted_lead);
    }
    catch (error) {
        logger.error(`--- Error in deleteLeadEndpoint ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error", error);
    }
}

export default deleteLeadEndpoint;