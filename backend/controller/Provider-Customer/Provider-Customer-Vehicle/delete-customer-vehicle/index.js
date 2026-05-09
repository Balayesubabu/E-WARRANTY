import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, deleteCustomerVehicle } from "./query.js";

const deleteCustomerVehicleEndpoint = async (req, res) => {
    try {
        logger.info(`deleteCustomerVehicleEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider details with user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.info(`--- No provider found with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider with user id ${user_id} fetched successfully ---`);

        const customer_vehicle_id = req.params.customer_vehicle_id;
        logger.info(`--- Deleting customer vehicle with customer_vehicle_id: ${customer_vehicle_id} ---`);

        const deletedCustomerVehicle = await deleteCustomerVehicle(customer_vehicle_id);
        if (!deletedCustomerVehicle) {
            logger.info(`--- Failed to delete customer vehicle ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete customer vehicle");
        }
        logger.info(`--- Customer vehicle deleted successfully with data: ${JSON.stringify(deletedCustomerVehicle)} ---`);

        return returnResponse(res, StatusCodes.OK, "Customer vehicle deleted successfully", deletedCustomerVehicle);
    } catch (error) {
        logger.error(`deleteCustomerVehicleEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { deleteCustomerVehicleEndpoint };