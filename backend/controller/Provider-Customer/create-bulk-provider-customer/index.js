import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, createBulkProviderCustomers } from "./query.js";

const createBulkProviderCustomerEndpoint = async (req, res) => {
  try {
    logger.info(`createBulkProviderCustomerEndpoint`);

    const user_id = req.user_id;

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

    const dataArray = req.body;

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "Request body must be a non-empty array of customers"
      );
    }

    logger.info(`--- Bulk Request Body: ${JSON.stringify(dataArray)} ---`);

    const providerCustomers = await createBulkProviderCustomers(
      dataArray,
      provider.id
    );

    logger.info(
      `--- Bulk Provider customers created: ${JSON.stringify(
        providerCustomers
      )} ---`
    );

    return returnResponse(
      res,
      StatusCodes.CREATED,
      "Provider customers created successfully",
      providerCustomers
    );
  } catch (error) {
    logger.error("Error in createBulkProviderCustomerEndpoint", error);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "Internal Server Error"
    );
  }
};

export { createBulkProviderCustomerEndpoint };
