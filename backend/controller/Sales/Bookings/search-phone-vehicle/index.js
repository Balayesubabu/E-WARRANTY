import { logger, returnError, returnResponse } from "../../../../services/logger.js";

import { getProviderByUserId, searchPhoneVehicle } from "./query.js";

const searchPhoneVehicleController = async (req, res) => {
  try {
    const { search_value } = req.body;
    let user_id;
    let staff_id;
    if (req.type == 'staff') {
      user_id = req.user_id;
      staff_id = req.staff_id;
    }
    if (req.type == 'provider') {
      user_id = req.user_id;
      staff_id = null;
    }
        const franchise_id = req.franchise_id;

    logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found with user id ${req.user_id} ---`);
      return returnError(res, 404, `Provider not found with user id ${req.user_id}`);
    }

    logger.info(`--- Provider found with user id ${req.user_id} ---`);

    if (!search_value) {
      logger.error(`--- Search value is required ---`);
      return returnError(res, 400, `Search value is required`);
    }
    logger.info(`--- Searching for phone or vehicle number: ${search_value} ---`);
    const results = await searchPhoneVehicle(search_value, provider.id);

    if (results.length === 0) {
      logger.info(`--- No matches found for value: ${search_value} ---`);
      return returnError(res, 404, `No matches found for value: ${search_value}`);
    }
    logger.info(`--- Matches found for value: ${search_value} ---`);
    return returnResponse(res, 200, results);
  } catch (error) {
    logger.error(`Error in searchPhoneVehicleController: ${error.message}`);
    return returnError(res, 500, error.message);
  }
};
export { searchPhoneVehicleController };