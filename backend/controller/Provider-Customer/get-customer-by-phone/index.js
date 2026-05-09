import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getCustomerByPhone } from "./query.js";

const getCustomerByPhoneEndpoint = async (req, res) => {
  try {
    logger.info(`getCustomerByPhoneEndpoint`);

    const user_id = req.user_id;
    const phone = req.query.phone;

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    logger.info(`--- Fetching customer by phone ---`);
    const customer = await getCustomerByPhone(provider.id, phone);
    if (!customer) {
      logger.error(`--- Customer not found for phone: ${phone} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Customer not found`);
    }
    logger.info(`--- Customer found for phone: ${phone} ---`);

    return returnResponse(res, StatusCodes.OK, `Customer found`, customer);
  } catch (error) {
    logger.error(`Error in getCustomerByPhoneEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getCustomerByPhoneEndpoint: ${error.message}`
    );
  }
};

export { getCustomerByPhoneEndpoint };
