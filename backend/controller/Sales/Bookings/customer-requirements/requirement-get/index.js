import { logger,returnError,returnResponse } from "../../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getAllCustomerRequirements } from "./query.js";

const getAllRequirementsEndpoint = async (req, res) => {
    try {
        logger.info(`getAllRequirementsEndpoint`);
        let user_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
        }
        const franchise_id = req.franchise_id;
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }

        const requirements = await getAllCustomerRequirements(provider.id, franchise_id);
        return returnResponse(res, StatusCodes.OK, requirements);
    } catch (error) {
        logger.error(`Error in getAllRequirementsEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching requirements");
    }
};
export { getAllRequirementsEndpoint };