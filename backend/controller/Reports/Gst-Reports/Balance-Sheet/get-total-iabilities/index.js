// endpoint.js
import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../../services/logger.js";
import { getProviderByUserId, getProviderTotalLiabilities } from "./query.js";

const getProviderTotalLiabilitiesEndPoint = async (req, res) => {
  try {
    logger.info(`getProviderTotalLiabilitiesEndPoint`);

    let user_id;
    let staff_id;
    if (req.type == "staff") {
      user_id = req.user_id;
      staff_id = req.staff_id;
    }
    if (req.type == "provider") {
      user_id = req.user_id;
      staff_id = null;
    }
    let franchise_id = req.franchise_id;

    logger.info(`--- Fetching provider by user id : ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.info(`--- Provider not found for user id : ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    logger.info(
      `--- Fetching total liabilities for provider id : ${provider.id} ---`
    );

    const total_liabilities = await getProviderTotalLiabilities(provider.id, franchise_id);

    logger.info(
      `--- Total liabilities calculated: ${total_liabilities} for provider id : ${provider.id} ---`
    );

    return returnResponse(
      res,
      StatusCodes.OK,
      "Total liabilities fetched successfully",
      { total_liabilities }
    );
  } catch (error) {
    logger.error(`Error in getProviderTotalLiabilitiesEndPoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch total liabilities"
    );
  }
};

export { getProviderTotalLiabilitiesEndPoint };
