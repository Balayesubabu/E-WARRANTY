import { logger,returnError,returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getAllOpenInventoryByMultipleIds, getProviderByUserId } from "./query.js";

const getAllOpenInventoryByMultipleIdsEndpoint = async (req, res) => {
    try {
        logger.info(`getAllOpenInventoryByMultipleIdsEndpoint`);
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

        logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
        const provider = await getProviderByUserId(user_id);    
        if (!provider) {
            logger.error(`--- Provider not found with user id ${req.user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }

        logger.info(`--- Provider found with user id ${req.user_id} ---`);

        const { open_inventory_ids } = req.body;
        if (!open_inventory_ids || !Array.isArray(open_inventory_ids) || open_inventory_ids.length === 0) {
            logger.error(`--- open_inventory_ids array is required in the request body ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `open_inventory_ids array is required in the request body`);
        }
        logger.info(`--- Fetching all open inventory by multiple ids ---`);
        const openInventoryList = await getAllOpenInventoryByMultipleIds(open_inventory_ids, provider.id, franchise_id);
        if (!openInventoryList) {
            logger.error(`--- Failed to fetch open inventory ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to fetch open inventory`);
        }
        logger.info(`--- Open inventory fetched successfully ---`);
        return returnResponse(res, StatusCodes.OK, openInventoryList);
    }

    catch (error) {
        logger.error(`Error in getAllOpenInventoryByMultipleIdsEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }

}

export { getAllOpenInventoryByMultipleIdsEndpoint };