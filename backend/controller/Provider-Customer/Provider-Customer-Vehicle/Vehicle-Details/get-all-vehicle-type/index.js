import { logger, returnError, returnResponse } from "../../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getAllVehicleTypes } from "./query.js";

const getAllVehicleTypesEndpoint = async (req, res) => {
    try {
        logger.info(`getAllVehicleTypesEndpoint`);

        logger.info(`--- Fetching all vehicle types from the database ---`);
        const vehicleTypes = await getAllVehicleTypes();
        if (vehicleTypes.length === 0) {
            logger.info(`--- No vehicle types found in the database ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "No vehicle types found in the database");
        }

        logger.info(`--- Vehicle types fetched successfully ---`);
        return returnResponse(res, StatusCodes.OK, "Vehicle types fetched successfully", vehicleTypes);
    } catch (error) {
        logger.error(`getAllVehicleTypesEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getAllVehicleTypesEndpoint };