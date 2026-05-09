import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId } from "./query.js";
import { getAllStaffByProviderId } from "./query.js";

const getAllStaffEndpoint = async (req, res) => {
  try {
    logger.info(`GetAllStaffEndpoint`);

    let user_id;
    if(req.type == 'staff'){
        user_id = req.user_id;
    }
    if(req.type == 'provider'){
        user_id = req.user_id;
    }
    
    const franchise_id = req.franchise_id;
  
    logger.info(`--- Fetching provider by user id ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found with user id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found with user id: ${user_id} ---`);

    logger.info(`--- Fetching all staff for provider id: ${provider.id} ---`);
    const staffList = await getAllStaffByProviderId(provider.id,franchise_id);

    return returnResponse(
      res,
      StatusCodes.OK,
      `Staff list fetched successfully`,
      staffList
    );
  } catch (error) {
    logger.error(`--- Error in GetAllStaffEndpoint: ${error} ---`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to get staff list`
    );
  }
};

export { getAllStaffEndpoint };
