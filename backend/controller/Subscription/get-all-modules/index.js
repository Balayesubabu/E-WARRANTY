import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId,getAllModules} from "./query.js";

const getAllModulesEndpoint = async (req, res) => {
    try {
        logger.info(`getAllModules`);
        const user_id = req.user_id;

        logger.info(`--- Checking if provider is there for user id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for user id: ${user_id}`);
        }
        logger.info(`--- Provider found for user id: ${user_id} ---`);

        logger.info(`--- Fetching allModules ---`);
        const allModules = await getAllModules();
        if (!allModules) {
            logger.error(`--- Modules not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Modules not found`);
        }
        logger.info(`--- Modules found with data ${JSON.stringify(allModules)} ---`);

        return returnResponse(res, StatusCodes.OK, `Modules fetched successfully`, allModules);
    } catch (error) {
        logger.error(`--- Error fetching all allModules ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getAllModulesEndpoint };