import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../../services/logger.js";
import { createBalanceSheetEntry, getProviderByUserId } from "./query.js";

const createBalanceSheetEntryEndpoint = async (req, res) => {
  try {
    logger.info(`createBalanceSheetEntryEndpoint`);

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
        const franchise_id = req.franchise_id;

    logger.info(`--- Fetching provider by user id : ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.info(`--- Provider not found for user id : ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }
    logger.info(`--- Provider found with user id : ${user_id} ---`);

    const data = req.body;

    const { type, name, amount } = data;

    logger.info(
      `--- Creating balance sheet entry for provider id : ${provider.id} ---`
    );

    const balance_sheet_entry = await createBalanceSheetEntry(
      provider.id,
      franchise_id,
      type,
      name,
      amount
    );
    if (!balance_sheet_entry) {
      logger.info(
        `--- Failed to create balance sheet entry for provider id : ${provider.id} ---`
      );
      return returnError(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to create balance sheet entry"
      );
    }
    logger.info(
      `--- Balance sheet entry created successfully for provider id : ${provider.id} ---`
    );
    return returnResponse(
      res,
      StatusCodes.CREATED,
      "Balance sheet entry created successfully",
      balance_sheet_entry
    );
  } catch (error) {
    logger.error(`Error in createBalanceSheetEntryEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to create balance sheet entry"
    );
  }
};

export { createBalanceSheetEntryEndpoint };
