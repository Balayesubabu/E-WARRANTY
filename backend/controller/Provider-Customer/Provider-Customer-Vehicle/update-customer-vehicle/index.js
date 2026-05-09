import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, updateCustomerVehicle } from "./query.js";

const updateCustomerVehicleEndpoint = async (req, res) => {
    try {
        logger.info(`updateCustomerVehicleEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider details with user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.info(`--- No provider found with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider with user id ${user_id} fetched successfully ---`);

        const customer_vehicle_id = req.params.customer_vehicle_id;
        logger.info(`--- Updating customer vehicle with customer_vehicle_id: ${customer_vehicle_id} ---`);

        const data = req.body;

        const {
            vehicle_number,
            vehicle_type,
            vehicle_model,
            vehicle_color,
            vehicle_fuel_type,
            vehicle_transmission,
            vehicle_variant,
            vehicle_make_year,
            vehicle_mileage,
            vehicle_insurance_details,
            vehicle_engine_number,
            vehicle_chassis_number,
            vehicle_registration_number,
            vehicle_images,
        } = data;

        logger.info(`--- Updating customer vehicle with data: ${JSON.stringify(data)} ---`);

        const updatedCustomerVehicle = await updateCustomerVehicle(customer_vehicle_id, data);
        if (!updatedCustomerVehicle) {
            logger.info(`--- Failed to update customer vehicle ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update customer vehicle");
        }
        logger.info(`--- Customer vehicle updated successfully with data: ${JSON.stringify(updatedCustomerVehicle)} ---`);

        return returnResponse(res, StatusCodes.OK, "Customer vehicle updated successfully", updatedCustomerVehicle);
    } catch (error) {
        logger.error(`updateCustomerVehicleEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { updateCustomerVehicleEndpoint };