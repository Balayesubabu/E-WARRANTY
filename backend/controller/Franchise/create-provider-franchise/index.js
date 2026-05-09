import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, createFranchise,getTotalFranchisesByProviderId } from "./query.js";

const createProviderFranchise = async (req, res) => {
    try {
        logger.info(`createProviderFranchise`);

        logger.info(`--- Checking user id from the request ---`);
        const user_id = req.user_id;
        logger.info(`--- User id: ${user_id} ---`);

        const data = req.body;

        const { name, address, city, state, country, pin_code, phone_number, email } = data;

        logger.info(`--- Fetching provider details ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${user_id}`);
        }
        logger.info(`--- Found provider ${JSON.stringify(provider)} with user id ${user_id} ---`);

        logger.info(`--- Checking provider total branches from franchises ---`);
        const total_franchises = await getTotalFranchisesByProviderId(provider.id);
        logger.info(`--- Total branches for provider ${provider.id} is ${total_franchises} ---`);
        const max_branches = provider.total_branches || 1;
        logger.info(`--- Provider max branches is ${max_branches} ---`);
        if (total_franchises >= max_branches) {
            logger.error(`--- Provider has reached the maximum number of branches (${max_branches}) ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Provider has reached the maximum number of branches (${max_branches})`);
        } 

        
        logger.info(`--- Creating franchise for provider ---`);
        const newFranchise = await createFranchise(provider, data);
        if (!newFranchise) {
            logger.error(`--- Failed to create franchise for provider ${provider.id} and data ${JSON.stringify(data)} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create franchise for provider ${provider.id}`);
        }
        logger.info(`--- Franchise created successfully for provider ${provider.id} and data ${JSON.stringify(data)} ---`);

        return returnResponse(res, StatusCodes.CREATED, `Franchise created successfully`, newFranchise);

    } catch (error) {
        logger.error('Error in createProviderFranchise:', error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
    }
}

export { createProviderFranchise };
