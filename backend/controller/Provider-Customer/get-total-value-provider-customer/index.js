import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import {
  getProviderByUserId,
  getProviderCustomersByProviderId,
} from "./query.js";

const getTotalValueProviderCustomersEndPoint = async (req, res) => {
  try {
    logger.info(`getTotalValueProviderCustomersEndPoint`);
    const user_id = req.user_id;

    logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found with user id ${req.user_id} ---`);
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Provider not found with user id ${req.user_id}`
      );
    }
    logger.info(`--- Provider found with user id ${req.user_id} ---`);

    logger.info(`--- Fetching provider customers for count ---`);
    const providerCustomers = await getProviderCustomersByProviderId(
      provider.id
    );

    const totalCustomers = providerCustomers?.length || 0;

    logger.info(
      `--- Total provider customers for provider id ${provider.id} = ${totalCustomers} ---`
    );

    return returnResponse(
      res,
      StatusCodes.OK,
      `Total provider customers fetched successfully`,
      { totalCustomers }
    );
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
  }
};

export { getTotalValueProviderCustomersEndPoint };
