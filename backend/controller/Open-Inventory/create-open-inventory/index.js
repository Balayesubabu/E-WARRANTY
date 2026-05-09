import { logger,returnError,returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {getProviderByUserId, createOpenInventory , getFranchiseInventoryById,updateFranchiseInventoryQuantity,getItemcodeFromProvider,createOpenInventoryTransactions} from "./query.js";
import crypto from "crypto";
const generateItemCode = () => {
    const buffer = crypto.randomBytes(8); // 8 bytes = 64 bits
    const number = buffer.readBigInt64BE(); // No need for second param

    const min = 1_000_000_000_000n;
    const max = 9_999_999_999_999n;

    // Ensure number is positive
    const positiveNumber = number < 0n ? -number : number;

    const itemCode = min + (positiveNumber % (max - min + 1n));

    // Return as string, padded to 13 digits
    return itemCode.toString().padStart(13, "0");
};

const createOpenInventoryEndpoint = async (req, res) => {
    try {
        logger.info(`createOpenInventoryEndpoint`);
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
        const franchise_inventory_id = req.body.franchise_inventory_id;
        const data = req.body;
        const open_inventory_quantity = req.body.open_inventory_quantity;
        let number = req.body.open_inventory_quantity;
        

        logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${req.user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        } 
        logger.info(`--- Provider found with user id ${req.user_id} ---`);
        
        logger.info(`--- Checking if franchise Inventory id is present ---`);
        const existingFranchiseInventory = await getFranchiseInventoryById(franchise_inventory_id, franchise_id, provider.id);
        if (!existingFranchiseInventory) {
            logger.error(`--- Franchise Inventory not found with id ${franchise_inventory_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Franchise Inventory not found with id ${franchise_inventory_id}`);
        }
        logger.info(`--- Franchise Inventory found with id ${franchise_inventory_id} ---`);



        logger.info(`--- Generating ${number} unique item codes ---`);

        const itemCodeList = new Set(); // Use a Set to avoid duplicates locally

        let attempts = 0;
        const maxAttempts = number * 10; // Safety limit to avoid infinite loops

        while (itemCodeList.size < number && attempts < maxAttempts) {
            attempts++;
            const item_code = generateItemCode();

            // Check database for uniqueness
            const exists = await getItemcodeFromProvider(provider.id, item_code, franchise_id);
            if (!exists && !itemCodeList.has(item_code)) {
                itemCodeList.add(item_code);
            }
        }

        if (itemCodeList.size < number) {
            logger.error(`--- Could not generate enough unique item codes after ${attempts} attempts ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Could not generate enough unique item codes. Please try again.", null);
        }

        logger.info(`--- Successfully generated ${itemCodeList.size} item codes ---`);


        
        logger.info(`--- Creating open inventory for provider id ${provider.id} ---`);  
        const openInventory = await createOpenInventory(data, staff_id, franchise_id, provider.id, itemCodeList);
        if (!openInventory) {
            logger.error(`--- Error in creating open inventory for provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in creating open inventory for provider id ${provider.id}`);
        }
        logger.info(`--- Open inventory created for provider id ${provider.id} ---`);
        // let existingOpenInventoryQuantity = existingFranchiseInventory.open_inventory_quantity || 0;
        let update_inventory_quantity = existingFranchiseInventory.product_quantity - open_inventory_quantity;
        if(update_inventory_quantity < 0){
            update_inventory_quantity = 0;
        }

        const FranchiseInventory = await updateFranchiseInventoryQuantity(franchise_inventory_id, open_inventory_quantity, update_inventory_quantity);
        if (!FranchiseInventory) {
            logger.error(`--- Error in updating franchise inventory quantity for id ${franchise_inventory_id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updating franchise inventory quantity for id ${franchise_inventory_id}`);
        }

        logger.info(`--- Franchise inventory transcation quantity updated for id ${franchise_inventory_id} ---`);
        const openInventoryTransactions = await createOpenInventoryTransactions(franchise_inventory_id, provider.id, franchise_id, open_inventory_quantity, update_inventory_quantity);
        if (!openInventoryTransactions) {
            logger.error(`--- Error in creating open inventory transactions for open inventory id ${openInventory.id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in creating open inventory transactions for open inventory id ${openInventory.id}`);
        }
        logger.info(`--- Open inventory transactions created for open inventory id ${openInventory.id} ---`);
        
        logger.info(`--- Open inventory created successfully ---`);
        return returnResponse(res, StatusCodes.CREATED, `Open inventory created successfully`, {openInventory, FranchiseInventory, itemCodes: Array.from(itemCodeList)});
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }   
};

export { createOpenInventoryEndpoint };