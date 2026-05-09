import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  // createQuickSettings,
  getQuickSettings,
  // updateQuickSettings,
} from "./query.js";
import { Prisma } from "@prisma/client";

const getQuickSettingsEndPoint = async (req, res) => {
  try {
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
    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    const invoice_type = req.query.invoice_type;
    console.log("invoice_type", invoice_type);
    
      if (!invoice_type) {
    return returnError(res, StatusCodes.BAD_REQUEST, 'invoice_type query parameter is required');
  }

    const quickSettings = await getQuickSettings(provider.id, franchise_id, invoice_type);

    console.log("quickSettings", quickSettings);
    

    // if (!quickSettings || quickSettings.length === 0) {
    //   logger.error(`--- QuickSettings not found ---`);
    //   return returnError(
    //     res,
    //     StatusCodes.BAD_REQUEST,
    //     `QuickSettings not found`
    //   );
    // }
    logger.info(`--- QuickSettings found ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      `QuickSettings found`,
      quickSettings
    );
  } catch {
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Internal Server Error`
    );
  }
};


export {
  getQuickSettingsEndPoint
};
