import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { getProviderByUserId, getServicePackageById, deletePackage } from "./query.js";
import { StatusCodes } from "http-status-codes";

const deletePackageEndpoint = async (req, res) => {
    try {
        const { package_id } = req.params;
        const user_id = req.user_id;

        logger.info(`--- Checking if provider exists for user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found for user id ${user_id} ---`);

        logger.info(`--- Checking if package exists for provider id ${provider.id} and package id ${package_id} ---`);
        const servicePackage = await getServicePackageById(package_id, provider.id);
        if (!servicePackage) {
            logger.error(`--- Package not found for provider id ${provider.id} and package id ${package_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Package not found");
        }
        logger.info(`--- Package found for provider id ${provider.id} and package id ${package_id} ---`);

        logger.info(`--- Deleting package with id ${package_id} ---`);
        const deletedPackage = await deletePackage(package_id, provider.id);
        if (!deletedPackage) {
            logger.error(`--- Package not deleted for provider id ${provider.id} and package id ${package_id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Package not deleted");
        }
        logger.info(`--- Package deleted for provider id ${provider.id} and package id ${package_id} ---`);

        return returnResponse(res, StatusCodes.OK, "Package deleted", deletedPackage);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error deleting package");
    }
}
export { deletePackageEndpoint };