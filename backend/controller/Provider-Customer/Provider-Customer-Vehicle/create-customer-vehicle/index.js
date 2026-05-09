import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  getCustomerById,
  createCustomerVehicle,
} from "./query.js";

const createCustomerVehicleEndpoint = async (req, res) => {
  try {
    logger.info(`createCustomerVehicleEndpoint`);

    const user_id = req.user_id;

    logger.info(`--- Fetching provider details with user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.info(`--- No provider found with user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }
    logger.info(
      `--- Provider with user id ${user_id} fetched successfully ---`
    );

    const data = req.body;

    const {
      provider_customer_id,
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

    logger.info(
      `--- Checking if the customer with id ${provider_customer_id} exists ---`
    );
    const customer = await getCustomerById(provider_customer_id);
    if (!customer) {
      logger.info(`--- No customer found with id ${provider_customer_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Customer not found");
    }
    logger.info(
      `--- Customer with id ${provider_customer_id} fetched successfully ---`
    );

    logger.info(
      `--- Creating customer vehicle with data: ${JSON.stringify(data)} ---`
    );
    const customerVehicle = await createCustomerVehicle(data);
    if (!customerVehicle) {
      logger.info(`--- Failed to create customer vehicle ---`);
      return returnError(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to create customer vehicle"
      );
    }
    logger.info(
      `--- Customer vehicle created successfully with data: ${JSON.stringify(
        customerVehicle
      )} ---`
    );

    return returnResponse(
      res,
      StatusCodes.OK,
      "Customer vehicle created successfully",
      customerVehicle
    );
  } catch (error) {
    logger.error(`createCustomerVehicleEndpoint: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { createCustomerVehicleEndpoint };
