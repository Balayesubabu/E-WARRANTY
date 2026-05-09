import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderDeliveryChallan } from "./query.js";

const getProviderDeliveryChallanEndpoint = async (req, res) => {
  try {
    logger.info(`getProviderDeliveryChallanEndpoint`);
     let user_id;
        let staff_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
            staff_id = req.staff_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
            staff_id = null;
        }
        const franchise_id = req.franchise_id

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }

    logger.info(
      `--- Fetching delivery challan details for provider_id: ${provider.id} ---`
    );
    const deliveryChallan = await getProviderDeliveryChallan(provider.id);
    if (!deliveryChallan || deliveryChallan.length === 0) {
      logger.error(
        `--- Delivery challan not found for provider_id: ${provider.id} ---`
      );
      return returnResponse(
        res,
        StatusCodes.OK,
        `Delivery challan not found`,
        deliveryChallan
      );
    }

    logger.info(
      `--- Delivery challan found for provider_id: ${provider.id} ---`
    );
    return returnResponse(
      res,
      StatusCodes.OK,
      "Delivery challan found",
      deliveryChallan
    );
  } catch (error) {
    logger.error(`Error in getProviderDeliveryChallanEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getProviderDeliveryChallanEndpoint: ${error.message}`
    );
  }
};

export { getProviderDeliveryChallanEndpoint };
