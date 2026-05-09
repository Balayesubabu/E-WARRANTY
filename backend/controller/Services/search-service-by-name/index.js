import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { getProviderByUserId, getServiceByName } from "./query.js";
import { StatusCodes } from "http-status-codes";

const searchServiceByNameEndPoint = async (req, res) => {
    try {
        logger.info(`searchServiceByNameEndPoint`);
        const { service_name } = req.body;

        let user_id;
        let staff_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
            staff_id = req.staff_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
            staff_id = null;
        }
        const franchise_id = req.franchise_id;

        logger.info(`--- Fetching provider by user_id : ${user_id} ---`);

        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found", null);
        }
        logger.info(`--- Provider found ---`);

        logger.info(`--- Fetching service by service_name : ${service_name} for provider : ${provider.id} ---`);

        const service = await getServiceByName(service_name, provider.id, franchise_id);
        if (!service) {
            logger.error(`--- Service not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Service not found", null);
        }
        logger.info(`--- Service found ---`);

        return returnResponse(res, StatusCodes.OK, "Service found", service);
    } catch (error) {
        logger.error(`--- Error in searchServiceByNameEndPoint ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error", null);
    }
}

export { searchServiceByNameEndPoint };