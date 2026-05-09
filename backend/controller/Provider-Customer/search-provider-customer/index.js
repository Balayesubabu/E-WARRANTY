import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, searchCustomers } from "./query.js";

const searchCustomersEndpoint = async (req, res) => {
  try {
    logger.info(`searchCustomersEndpoint`);

    const user_id = req.user_id;
    const searchText = req.query.q; // user input (q=...)

    if (!searchText) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "Search text is required"
      );
    }

    logger.info(`--- Fetching provider for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }

    logger.info(`--- Searching customers by: ${searchText} ---`);
    const customers = await searchCustomers(provider.id, searchText);

    if (!customers || customers.length === 0) {
      logger.error(`--- No customers found for search: ${searchText} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `No customers found`);
    }

    logger.info(`--- Found ${customers.length} customers ---`);
    return returnResponse(res, StatusCodes.OK, `Customers found`, customers);
  } catch (error) {
    logger.error(`Error in searchCustomersEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in searchCustomersEndpoint: ${error.message}`
    );
  }
};

export { searchCustomersEndpoint };
