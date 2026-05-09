import {getProviderByUserId, getFranchiseInventoryById , } from "./query.js";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { FranchiseInventory, FranchiseInventoryTransaction } from "../../../prisma/db-models.js";

const updateInventoryByIdEndpoint = async (req, res) => {
    try {
        logger.info(`updateInventoryByIdEndpoint`);
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
        logger.info(`--- Fetching provider id from the user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${user_id} ---`);

        let data = req.body;

        let {
            quantity,
            action
        } = data;


        const {id} = req.params;
        const getProductInventory = await getFranchiseInventoryById(id ,provider.id , franchise_id);
        if (!getProductInventory) {
            logger.error(`--- Franchise inventory not found with franchise inventory id ${id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Franchise inventory not found with franchise inventory id ${id}`);
        }
        logger.info(`--- Franchise inventory found with franchise inventory id ${id} ---`);
        if(!quantity) {
            logger.error(`--- Product quantity is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Product quantity is required`);
        }

        if(quantity < 0) {
            logger.error(`--- Product quantity must be greater than 0 ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Product quantity must be greater than 0`);
        }

        let product_quantity = 0;
        if (action == "add") {
            product_quantity = getProductInventory.product_quantity + quantity;
        } else if (action == "reduce") {
            product_quantity = getProductInventory.product_quantity - quantity;
        }

        const updateProductInventory = await FranchiseInventory.update({
            where: {
                id: id,
                franchise_id: franchise_id
            },
            data: {
                product_quantity: product_quantity,
                updated_by: staff_id || provider.id,
                updated_at:new Date()
            }
        });
        if (!updateProductInventory) {
            logger.error(`--- Franchise inventory not found with franchise inventory id ${id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Franchise inventory not found with franchise inventory id ${id}`);
        }
        logger.info(`--- Franchise inventory updated with franchise inventory id ${id} ---`);

        logger.info(`create franchise transaction`)
        const createFranchiseTransaction = await FranchiseInventoryTransaction.create({
            data: {
                provider_id: provider.id,
                franchise_id: franchise_id,
                franchise_inventory_id: id,
                quantity: quantity,
                action: action,
                closing_stock : updateProductInventory.product_quantity,
                stock_changed_by : "self",

            }
        });
        if (!createFranchiseTransaction) {
            logger.error(`--- Franchise transaction not created with franchise inventory id ${id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Franchise transaction not created with franchise inventory id ${id}`);
        }
        logger.info(`--- Franchise transaction created with franchise inventory id ${id} ---`);

        return returnResponse(res, StatusCodes.OK, `Franchise inventory updated successfully`, updateProductInventory);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updateInventoryByIdEndpoint: ${error}`);
    }
}

export  {updateInventoryByIdEndpoint}