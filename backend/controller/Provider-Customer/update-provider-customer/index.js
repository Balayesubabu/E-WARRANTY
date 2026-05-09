import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, updateProviderCustomer } from "./query.js";

const updateProviderCustomerEndpoint = async (req, res) => {
  try {
    logger.info(`updateProviderCustomerEndpoint`);

    const user_id = req.user_id;
    const { customer_id } = req.params;
    const data = req.body;

    logger.info(`--- Fetching provider id for user ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);

    if (!provider) {
      logger.error(`Provider not found with user id ${user_id}`);
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Provider not found with user id ${user_id}`
      );
    }

    logger.info(`--- Provider found: ${provider.id} ---`);
    logger.info(
      `--- Updating customer ${customer_id} with data: ${JSON.stringify(
        data
      )} ---`
    );

    const providerCustomer = await updateProviderCustomer(
      data,
      customer_id,
      provider.id
    );

    logger.info(
      `--- Provider customer updated: ${JSON.stringify(providerCustomer)} ---`
    );

    return returnResponse(
      res,
      StatusCodes.OK,
      "Provider customer updated successfully",
      providerCustomer
    );
  } catch (error) {
    logger.error("Error in updateProviderCustomerEndpoint", error);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "Internal Server Error"
    );
  }
};

export { updateProviderCustomerEndpoint };
