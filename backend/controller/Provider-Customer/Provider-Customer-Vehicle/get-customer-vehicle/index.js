import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { getProviderByUserId, getCustomerById } from "./query.js";

const getCustomerVehicleEndpoint = async (req, res) => {
  try {
    logger.info(`getCustomerVehicleEndpoint`);

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

    const customer_id = req.params.customer_id;

    logger.info(
      `--- Fetching customer details with customer_id: ${customer_id} ---`
    );
    const customer = await getCustomerById(customer_id);
    if (!customer) {
      logger.info(`--- No customer found with customer_id: ${customer_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Customer not found");
    }
    logger.info(
      `--- Customer with customer_id ${customer_id} fetched successfully ---`
    );

    return returnResponse(
      res,
      StatusCodes.OK,
      "Customer vehicle fetched successfully",
      customer
    );
  } catch (error) {
    logger.error(`getCustomerVehicleEndpoint: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getCustomerVehicleEndpoint };
