import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getAllProviderNames } from "./query.js";

const getAllProviderNamesEndpoint = async (req, res) => {
    try {
        logger.info(`getAllProviderNamesEndpoint`);

        logger.info(`--- Getting all provider names ---`);
        const provider_names = await getAllProviderNames();
        if (!provider_names) {
            logger.error(`--- Provider names not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider names not found`);
        }
        logger.info(`--- Provider names found ---`);

        return returnResponse(res, StatusCodes.OK, `Provider names fetched successfully`, provider_names);
    } catch (error) {
        logger.error(`getAllProviderNamesEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get all provider names`);
    }
}

export { getAllProviderNamesEndpoint };