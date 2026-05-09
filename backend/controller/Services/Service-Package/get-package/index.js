import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { getProviderByUserId, getServicePackageById } from "./query.js";
import { StatusCodes } from "http-status-codes";

const getPackageEndpoint = async (req, res) => {
    try {
        logger.info(`getPackageEndpoint`);
        const { package_id } = req.params;
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

        logger.info(`--- Checking if provider exists for user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found for user id ${user_id} ---`);

        logger.info(`--- Checking if package exists for provider id ${provider.id} and package id ${package_id} ---`);
        const servicePackage = await getServicePackageById(package_id, provider.id,franchise_id);
        if (!servicePackage) {
            logger.error(`--- Package not found for provider id ${provider.id} and package id ${package_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Package not found");
        }
        logger.info(`--- Package found for provider id ${provider.id} and package id ${package_id} ---`);


        return returnResponse(res, StatusCodes.OK, "Package found", servicePackage);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error getting package");
    }
}

export { getPackageEndpoint };