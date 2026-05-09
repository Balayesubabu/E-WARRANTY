import { getProviderByUserId, getProviderServices } from "./query.js";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getFranchiseServicesEndpoint = async (req, res) => {
    try {
        logger.info(`getFranchiseServicesEndpoint`);
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

        logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${req.user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${req.user_id} ---`);

        logger.info(`--- Fetching services from the provider id ${provider.id} ---`);
        const services = await getProviderServices(provider.id,franchise_id);
        if (!services) {
            logger.error(`--- Services not found with provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Services not found with provider id ${provider.id}`);
        }
        logger.info(`--- Services found with provider id ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Services fetched successfully`, services);

    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getFranchiseServicesEndpoint };
