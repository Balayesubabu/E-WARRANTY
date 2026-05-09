import { getProviderByUserId, getProviderPaymentIn } from "./query.js";
import {
  logger,
  returnResponse,
  returnError,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getProviderPaymentInEndpoint = async (req, res) => {
  try {
    logger.info(`getProviderPaymentInEndpoint`);

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

    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }

    const paymentIn = await getProviderPaymentIn(provider.id,franchise_id);

    return returnResponse(
      res,
      StatusCodes.OK,
      `Provider payment in fetched successfully`,
      paymentIn
    );
  } catch (error) {
    logger.error(`Error in getProviderPaymentInEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getProviderPaymentInEndpoint`
    );
  }
};

export { getProviderPaymentInEndpoint };
