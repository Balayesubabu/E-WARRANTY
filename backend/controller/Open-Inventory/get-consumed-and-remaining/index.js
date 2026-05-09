import {logger,returnError,returnResponse} from "./../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getAllOpenInventory, getProviderByUserId,getConsumedStock} from "./query.js";

const getConsumedAndRemainingEndpoint = async (req, res) => {
    try {
        logger.info(`getConsumedAndRemainingEndpoint`);
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

        const provider = await getProviderByUserId(user_id);
        console.log(provider);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${req.user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }

        const getOpenInventory = await getAllOpenInventory(provider.id, franchise_id);
        console.log(getOpenInventory);
        if (!getOpenInventory) {
            logger.error(`--- No open inventory found for provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No open inventory found for provider id ${provider.id}`);
        }
        logger.info(`--- Open inventory fetched successfully for provider id ${provider.id} ---`);

        for (let i = 0; i < getOpenInventory.length; i++) {
                const total_stock = getOpenInventory[i].convertion_rate;
                getOpenInventory[i].total_stock = total_stock;
                const get_consumed_stock = await getConsumedStock(getOpenInventory[i].id, provider.id, franchise_id);
                let total_consumed = 0;
                for (let j = 0; j < get_consumed_stock.length; j++) {
                    console.log(get_consumed_stock[j]);
                    total_consumed += get_consumed_stock[j]._sum.measurement;

                }
                const remaining_stock = total_stock - total_consumed;
                getOpenInventory[i].consumed_stock = total_consumed;
                getOpenInventory[i].remaining_stock = remaining_stock;
        }
        return returnResponse(res, StatusCodes.OK, `Open inventory fetched successfully`, getOpenInventory);
    }
    catch (error) {
        logger.error(`Error in getConsumedAndRemainingEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getConsumedAndRemainingEndpoint };
