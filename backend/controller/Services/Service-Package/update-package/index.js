import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { getProviderByUserId, getServicePackageById, getServiceById, updatePackage } from "./query.js";
import { StatusCodes } from "http-status-codes";

const updatePackageEndpoint = async (req, res) => {
    try {
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
        const servicePackage = await getServicePackageById(package_id, provider.id);
        if (!servicePackage) {
            logger.error(`--- Package not found for provider id ${provider.id} and package id ${package_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Package not found");
        }
        logger.info(`--- Package found for provider id ${provider.id} and package id ${package_id} ---`);

        const data = req.body;

        const { name, description, services,duration} = data;

        // Extract service IDs from the services array
        const serviceIds = services.map(service => service.service_id);

        let price = req.body.price ? req.body.price === 0 ? 0 : req.body.price : 0;
        for (const serviceId of serviceIds) {
            logger.info(`--- Checking if service exists for provider id ${provider.id} and service id ${serviceId} ---`);
            const serviceData = await getServiceById(serviceId);
            if (!serviceData) {
                logger.error(`--- Service not found for provider id ${provider.id} and service id ${serviceId} ---`);
                return returnError(res, StatusCodes.NOT_FOUND, "Service not found");
            }
            logger.info(`--- Service found for provider id ${provider.id} and service id ${serviceId} ---`);
            if (!req.body.price || req.body.price === 0) {
                price += serviceData.service_total_price;
            }
            logger.info(`--- Service found for provider id ${provider.id} and service id ${serviceId} and price ${price} ---`);
        }

        logger.info(`--- Updating package with data ${JSON.stringify(data)} ---`);
        const updatedPackage = await updatePackage(package_id, provider.id, franchise_id, staff_id, {
            ...data,
            services: serviceIds,
        }, price);
        if (!updatedPackage) {
            logger.error(`--- Package not updated for provider id ${provider.id} and package id ${package_id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Package not updated");
        }
        logger.info(`--- Package updated for provider id ${provider.id} and package id ${package_id} ---`);

        return returnResponse(res, StatusCodes.OK, "Package updated", updatedPackage);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error updating package");
    }
}

export { updatePackageEndpoint };
