import { logger, returnError, returnResponse } from "../../../../../services/logger.js"
import { StatusCodes } from "http-status-codes";
import { getAllVehicleModels } from "./query.js";

const getAllVehicleModelsEndpoint = async (req, res) => {
    try {
        logger.info(`getAllVehicleModelsEndpoint`);

        logger.info(`--- Fetching all vehicle models from the database ---`);
        const vehicleModels = await getAllVehicleModels();
        if (vehicleModels.length === 0) {
            logger.info(`--- No vehicle models found in the database ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "No vehicle models found in the database");
        }

        logger.info(`--- Vehicle models fetched successfully ---`);
        return returnResponse(res, StatusCodes.OK, "Vehicle models fetched successfully", vehicleModels);
    } catch (error) {
        logger.error(`getAllVehicleModelsEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getAllVehicleModelsEndpoint };