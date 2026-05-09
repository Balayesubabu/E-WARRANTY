import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getStaffById } from "./query.js";

const getStaffDetailsEndpoint = async (req, res) => {
  try {
    logger.info(`GetStaffDetailsEndpoint`);

    let user_id;
    let staff_id;
    if(req.type == 'staff'){
        user_id = req.user_id;
        staff_id = req.staff_id;
    }
    if(req.type == 'provider'){
        user_id = req.user_id;
        staff_id = req.params.staff_id;
    }
    
    const franchise_id = req.franchise_id;
    console.log(franchise_id);

    logger.info(`--- Fetching provider by user id ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found with user id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found with user id: ${user_id} ---`);

    logger.info(`--- Fetching staff by id ---`);
    const staff = await getStaffById(provider.id, staff_id, franchise_id);
    if (!staff) {
      logger.error(`--- Staff not found with id: ${staff_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Staff not found`);
    }
    logger.info(`--- Staff found with id: ${staff_id} ---`);

    return returnResponse(
      res,
      StatusCodes.OK,
      `Staff details fetched successfully`,
      staff
    );
  } catch (error) {
    logger.error(`--- Error in GetStaffDetailsEndpoint: ${error} ---`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to get staff details`
    );
  }
};

export { getStaffDetailsEndpoint };
