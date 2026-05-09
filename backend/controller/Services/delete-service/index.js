import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { deleteService, getProviderByUserId } from "./query.js";

const deleteServiceEndpoint = async (req, res) => {
    try {
        logger.info(`deleteServiceEndpoint`);

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

        logger.info(`--- Getting provider by user id ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found ---`);

        const service_id = req.params.service_id;

        logger.info(`--- Deleting service with id ${service_id} ---`);
        const deletedService = await deleteService(service_id, provider.id, franchise_id, staff_id);
        if (!deletedService) {
            logger.error(`--- Service not deleted ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Service not deleted`);
        }
        logger.info(`--- Service deleted ---`);

        return returnResponse(res, StatusCodes.OK, `Service deleted successfully`, deletedService);
    }
    catch (error) {
        logger.info(`--- Error deleting service ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error deleting service`);
    }
}

export { deleteServiceEndpoint };