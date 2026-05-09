import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { getProviderByUserId, getFranchiseById, getFranchisePackages } from "./query.js";
import { StatusCodes } from "http-status-codes";

const getFranchisePackageEndpoint = async (req, res) => {
    try {
        logger.info(`getFranchisePackageEndpoint`);
        const { franchise_id } = req.params;
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

        logger.info(`--- Checking if provider exists for user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found for user id ${user_id} ---`);

        logger.info(`--- Checking if franchise exists for provider id ${provider.id} ---`);
        const franchise = await getFranchiseById(franchise_id);
        if (!franchise) {
            logger.error(`--- Franchise not found for provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Franchise not found");
        }
        logger.info(`--- Franchise found for provider id ${provider.id} ---`);

        logger.info(`--- Getting franchise packages for franchise id ${franchise.id} and provider id ${provider.id} ---`);
        const franchisePackages = await getFranchisePackages(franchise.id, provider.id);
        console.log(franchisePackages);
        if (!franchisePackages) {
            logger.error(`--- Franchise packages not found for franchise id ${franchise.id} and provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Franchise packages not found");
        }
        logger.info(`--- Franchise packages found for franchise id ${franchise.id} and provider id ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, "Franchise packages found", franchisePackages);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error getting franchise package");
    }
}

export { getFranchisePackageEndpoint };