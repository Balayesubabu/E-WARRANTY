import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { getProviderByUserId, getProviderCustomersByDate } from "./query.js";

const getProviderCustomerByDateEndpoint = async (req, res) => {
  try {
    logger.info(`getProviderCustomerByDateEndpoint`);

    const user_id = req.user_id;
    const { start_date, end_date } = req.query; // expects query params

    if (!start_date || !end_date) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "start_date and end_date are required"
      );
    }

    logger.info(`--- Fetching provider id from user_id ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found with user_id ${user_id} ---`);
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Provider not found with user id ${user_id}`
      );
    }

    logger.info(
      `--- Fetching provider customers between ${start_date} and ${end_date} ---`
    );
    const providerCustomers = await getProviderCustomersByDate(
      provider.id,
      start_date,
      end_date
    );

    return returnResponse(
      res,
      StatusCodes.OK,
      "Provider customers fetched successfully",
      providerCustomers
    );
  } catch (error) {
    logger.error(`Error in getProviderCustomerByDateEndpoint: ${error}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
  }
};

export { getProviderCustomerByDateEndpoint };
