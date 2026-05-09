import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, createProviderCustomer } from "./query.js";

const createProviderCustomerEndpoint = async (req, res) => {
  try {
    logger.info(`createProviderCustomerEndpoint`);

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

    const data = req.body;
    logger.info(`--- Request Body: ${JSON.stringify(data)} ---`);

    const providerCustomer = await createProviderCustomer(data, provider.id);

    logger.info(
      `--- Provider customer created: ${JSON.stringify(providerCustomer)} ---`
    );

    return returnResponse(
      res,
      StatusCodes.CREATED,
      "Provider customer created successfully",
      providerCustomer
    );
  } catch (error) {
    logger.error("Error in createProviderCustomerEndpoint", error);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "Internal Server Error"
    );
  }
};

export { createProviderCustomerEndpoint };
