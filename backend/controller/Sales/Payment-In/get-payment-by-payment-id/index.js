import { getProviderByUserId, getPaymentById } from "./query.js";
import {
  logger,
  returnResponse,
  returnError,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getPaymentInByPaymentIdEndpoint = async (req, res) => {
  try {
    logger.info(`getPaymentInByIdEndpoint`);

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
    const { id } = req.params; // payment id
    console.log("id", id);

    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }

    const payment = await getPaymentById( id);

    if (!payment || payment.length === 0) {
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `No payments found for  id: ${id}`
      );
    }

    return returnResponse(
      res,
      StatusCodes.OK,
      `Provider payment in fetched successfully for customer id: ${id}`,
      payment
    );
  } catch (error) {
    logger.error(`Error in getProviderPaymentInByIdEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getProviderPaymentInByIdEndpoint`
    );
  }
};

export { getPaymentInByPaymentIdEndpoint };
