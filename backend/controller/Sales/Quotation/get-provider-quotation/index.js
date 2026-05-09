import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderQuotation } from "./query.js";

const getProviderQuotationEndpoint = async (req, res) => {
  try {
    logger.info(`getProviderQuotationEndpoint`);

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
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    logger.info(
      `--- Fetching provider quotation details for provider_id: ${provider.id} ---`
    );
    const providerQuotation = await getProviderQuotation(provider.id);
    if (!providerQuotation || providerQuotation.length === 0) {
      logger.error(
        `--- Provider quotation not found for provider_id: ${provider.id} ---`
      );
      return returnResponse(
        res,
        StatusCodes.OK,
        `Provider quotation not found`,
        providerQuotation
      );
    }
    logger.info(
      `--- Provider quotation found for provider_id: ${provider.id} ---`
    );

    return returnResponse(
      res,
      StatusCodes.OK,
      `Provider quotation found`,
      providerQuotation
    );
  } catch (error) {
    logger.error(`Error in getProviderQuotationEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getProviderQuotationEndpoint: ${error.message}`
    );
  }
};

export { getProviderQuotationEndpoint };
