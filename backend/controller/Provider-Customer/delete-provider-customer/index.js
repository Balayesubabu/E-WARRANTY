import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import {
  getProviderByUserId,
  getCustomerById,
  deleteProviderCustomer,
} from "./query.js";

const deleteProviderCustomerEndpoint = async (req, res) => {
  try {
    logger.info(`deleteProviderCustomerEndpoint`);

    const user_id = req.user_id;
    const customer_id = req.params.customer_id;

    // ✅ Step 1: Verify provider
    logger.info(`--- Checking if provider exists for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`Provider not found with user id ${user_id}`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    // ✅ Step 2: Verify customer belongs to this provider
    logger.info(
      `--- Checking if customer exists for provider_id: ${provider.id}, customer_id: ${customer_id} ---`
    );
    const customer = await getCustomerById(customer_id, provider.id);
    if (!customer) {
      logger.error(
        `Customer not found with id ${customer_id} for provider ${provider.id}`
      );
      return returnError(res, StatusCodes.NOT_FOUND, "Customer not found");
    }

    // ✅ Step 3: Delete customer
    logger.info(
      `--- Deleting customer id ${customer_id} for provider id ${provider.id} ---`
    );
    try {
    const deletedCustomer = await deleteProviderCustomer(
      customer_id,
      provider.id
    );

    return returnResponse(
      res,
      StatusCodes.OK,
      "Customer deleted successfully",
      deletedCustomer
    );
  } catch (error) {
    logger.error(
      `Error deleting customer id ${customer_id} for provider id ${provider.id}: ${error}`
    );
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Unable to delete customer at this time refering other linked records"
    );
  }
  } catch (error) {
    logger.error("Error in deleteProviderCustomerEndpoint:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { deleteProviderCustomerEndpoint };
