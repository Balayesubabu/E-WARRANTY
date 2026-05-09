import  {getProviderByUserId, updateQuickSettings} from "./query.js"
import { logger, returnError, returnResponse } from "../../../services/logger.js"
import { StatusCodes } from "http-status-codes";

const createOrUpdateQuickSettingsEndPoint = async (req, res) => {
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

    const data = req.body


    logger.info("quick setting getting created")
    const quickSetting = await updateQuickSettings(provider.id, franchise_id, data)

  if (!quickSetting) {
      logger.error(`--- QuickSettings not created ---`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `QuickSettings not created`
      );
    }
    logger.info(`--- QuickSettings created ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      `QuickSettings created`,
      quickSetting
    )
 } catch (error) {
        return returnError(
            res,
             StatusCodes.INTERNAL_SERVER_ERROR,
      `Internal Server Error`
        )
    }
}

export{createOrUpdateQuickSettingsEndPoint}