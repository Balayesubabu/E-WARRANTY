import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { getProviderByUserId, getServiceById, createPackage } from "./query.js";
import { StatusCodes } from "http-status-codes";

const createPackageEndpoint = async (req, res) => {
    try {
        logger.info(`createPackageEndpoint`);

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

        const data = req.body;
        const { name, description, services,duration} = data;

        // Extract service IDs from the services array
        const serviceIds = services.map(service => service.service_id);

        let price = req.body.price ? req.body.price === 0 ? 0 : req.body.price : 0;
        for (const serviceId of serviceIds) {
            logger.info(`--- Checking if service with id ${serviceId} exists ---`);
            const serviceData = await getServiceById(serviceId);
            if (!serviceData) {
                logger.error(`--- Service not found for id ${serviceId} ---`);
                return returnError(res, StatusCodes.NOT_FOUND, "Service not found");
            }
            if (!req.body.price || req.body.price === 0) {
                price += serviceData.service_total_price;
            }
            logger.info(`--- Service found for id ${serviceId} ---`);
        }

        logger.info(`--- Creating package ---`);
        const servicePackage = await createPackage({
            ...data,
            services: serviceIds,  // Pass the extracted service IDs
            provider_id: provider.id,
            franchise_id: franchise_id,
            staff_id: staff_id
        }, price);
        if (!servicePackage) {
            logger.error(`--- Package not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error creating package");
        }
        logger.info(`--- Package created ---`);

        return returnResponse(res, StatusCodes.CREATED, "Package created successfully", servicePackage);

    } catch (error) {
        logger.error(error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error creating package", error);
    }
}

export { createPackageEndpoint };