import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderLeads } from "./query.js";

const getProviderLeadDateFilterEndpoint = async (req, res) => {
    try {
        logger.info(`getProviderLeadDateFilterEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Checking if provider exists with user_id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found with id ${provider.id} ---`);

        const { start_date, end_date } = req.query;

        logger.info(`--- Fetching leads for provider with id ${provider.id} and date filter ${start_date} to ${end_date} ---`);
        const leads = await getProviderLeads(provider.id, start_date, end_date);
        if (!leads) {
            logger.error(`--- No leads found for provider with id ${provider.id} and date filter ${start_date} to ${end_date} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "No leads found");
        }
        logger.info(`--- Leads fetched successfully for provider with id ${provider.id} and date filter ${start_date} to ${end_date} ---`);

        return returnResponse(res, StatusCodes.OK, "Leads fetched successfully", leads);
    }
    catch (error) {
        logger.error(`--- Error in getProviderLeadDateFilterEndpoint ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error", error);
    }
}

export default getProviderLeadDateFilterEndpoint;