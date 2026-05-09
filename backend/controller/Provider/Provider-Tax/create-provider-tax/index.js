import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, createProviderTax } from "./query.js";

const createProviderTaxEndpoint = async (req, res) => {
  try {
    logger.info(`createProviderTaxEndpoint`);

    const user_id = req.user_id;

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    const data = req.body;

    const { tax_type, tax_percentage, tax_name } = data;

    if (tax_type !== "GST" && tax_type !== "TCS" && tax_type !== "TDS") {
      logger.error(`--- Invalid tax type ---`);
      return returnError(res, StatusCodes.BAD_REQUEST, `Invalid tax type`);
    }

    logger.info(
      `--- Creating provider tax for provider_id: ${provider.id} ---`
    );
    const providerTax = await createProviderTax(provider.id, data);
    if (!providerTax) {
      logger.error(`--- Provider tax not created ---`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Provider tax not created`
      );
    }
    logger.info(`--- Provider tax created ---`);

    return returnResponse(
      res,
      StatusCodes.OK,
      `Provider tax created`,
      providerTax
    );
  } catch (error) {
    logger.error(`Error in createProviderTaxEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in createProviderTaxEndpoint`
    );
  }
};

export { createProviderTaxEndpoint };
