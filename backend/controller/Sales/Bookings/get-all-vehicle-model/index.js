import {logger,returnError,returnResponse} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getAllVehicleModel, getProviderByUserId } from "./query.js";

const getAllVehicleModelEndpoint = async (req, res) => {
    try {
        logger.info(`getAllVehicleModelEndpoint`);
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

        logger.info(`--- Fetching all vehicle models ---`);
        const allVehicleModels = await getAllVehicleModel(provider.id); 
        if (!allVehicleModels) {
            logger.error(`--- No vehicle models found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No vehicle models found`);
        }
        logger.info(`--- Vehicle models found ---`);    
        return returnResponse(res, StatusCodes.OK, allVehicleModels);
    }
    catch (error) {
        logger.error(`Error in getAllVehicleModelEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};
export { getAllVehicleModelEndpoint };