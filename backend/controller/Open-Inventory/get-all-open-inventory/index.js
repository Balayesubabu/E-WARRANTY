import { logger } from "../../../services/logger.js";
import { returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getAllOpenInventory } from "./query.js";

const getAllOpenInventoryController = async (req, res) => {
    try {
        logger.info(`getAllOpenInventoryController`);

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
        console.log(franchise_id);

        logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
        const provider = await getProviderByUserId(req.user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${req.user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${req.user_id} ---`);
        
        logger.info(`--- Fetching open inventory from the provider id ${provider.id} ---`);
        const open_inventory = await getAllOpenInventory(provider.id, franchise_id, staff_id);
        if (!open_inventory) {
            logger.error(`--- Open inventory not found with provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Open inventory not found with provider id ${provider.id}`);
        }
        logger.info(`--- Open inventory found with provider id ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, open_inventory);
    } catch (error) {
        logger.error(`Error in getAllOpenInventoryController: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

export { getAllOpenInventoryController };