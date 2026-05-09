import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { getFranchisesByProviderId, getProviderByUserId } from "./query.js";
import { StatusCodes } from "http-status-codes";

const getProviderFranchise = async (req, res) => {
    try {
        logger.info(`getAllProviderFranchise`);

        logger.info(`--- Fetching user id from the request ---`);
        const user_id = req.user_id;
        const franchise_id = req.params.franchise_id;
        logger.info(`--- User id: ${user_id} ---`);

        logger.info(`--- Fetching provider details with user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${user_id}`);
        }
        logger.info(`--- Found provider ${JSON.stringify(provider)} with user id ${user_id} ---`);

        logger.info(`--- Fetching franchises for provider ${provider.id} ---`);
        const franchises = await getFranchisesByProviderId(provider.id,franchise_id);
        if (!franchises) {
            logger.error(`--- No franchises found for provider ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No franchises found`);
        }
        logger.info(`--- Found ${franchises.length} franchises for provider ${provider.id} with data ${JSON.stringify(franchises)} ---`);

        return returnResponse(res, StatusCodes.OK, `Get franchise fetched successfully`, franchises);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
    }
}

export { getProviderFranchise };