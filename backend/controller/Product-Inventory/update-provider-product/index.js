import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getFranchiseInventoryById, updateProviderProduct, createFranchiseTransaction } from "./query.js";

const updateProviderProductEndpoint = async (req, res) => {
    try {
        logger.info(`updateProviderProductEndpoint`);

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

        logger.info(`--- Fetching provider with user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found `);
        }

        const data = req.body;

        let {
            product_id,
            product_name,
            product_hsn_code,
            product_item_code,
            product_custom_code,
            product_images,
            product_description,
            product_purchase_price,
            product_selling_price,
            product_sales_price_type,
            product_purchase_price_type,
            product_selling_price_input,
            product_quantity,
            product_measurement,
            product_measuring_unit,
            secondary_measuring_unit,
            convertion_rate,
            product_gst_percentage,
            product_gst_amount,
            product_original_price,
            product_total_price,
            product_status,
            product_low_stock_level,
            product_reorder_level,
            category_id
        } = data;

        const franchise_inventory_id = req.params.franchise_inventory_id;

        logger.info(`--- Checking if franchise inventory id is provided ---`);
        if (!franchise_inventory_id) {
            logger.error(`--- Franchise inventory id is not provided ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Franchise inventory id is not provided`);
        }

        logger.info(`--- Fetching franchise inventory with franchise_inventory_id: ${franchise_inventory_id} ---`);
        const franchise_inventory = await getFranchiseInventoryById(franchise_inventory_id);

        if (!franchise_inventory) {
            logger.error(`--- Franchise inventory not found with franchise_inventory_id: ${franchise_inventory_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Franchise inventory not found`);
        }

        logger.info(`--- Franchise inventory found with franchise_inventory_id: ${franchise_inventory_id} ---`);


        // logger.info(`--- Calculating product gst amount and total price if new gst percentage is provided and original price is not provided ---`);
        // if (product_gst_percentage) {
        //     product_gst_amount = (product_selling_price * product_gst_percentage) / 100;
        //     product_total_price = product_selling_price + product_gst_amount;
        //     data.product_gst_amount = product_gst_amount;
        //     data.product_total_price = product_total_price;
        // }
        // logger.info(`--- Product gst amount and total price calculated ${product_gst_amount} and ${product_total_price} ---`);

        logger.info(`--- Updating provider product with product_id: ${product_id} ---`);
        const updated_provider_product = await updateProviderProduct(franchise_inventory.id, data,provider.id, franchise_id, staff_id);
        if (!updated_provider_product) {
            logger.error(`--- Failed to update provider product with product_id: ${product_id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update provider product`);
        }
        logger.info(`--- Provider product updated with product_id: ${product_id} and data : ${JSON.stringify(data)} ---`);

        logger.info(`--- Creating franchise transaction with provider id: ${provider.id} and franchise id: ${franchise_id} and franchise inventory id: ${franchise_inventory_id} and product quantity: ${product_quantity} ---`);
        const create_franchise_transaction = await createFranchiseTransaction(provider.id, franchise_id, franchise_inventory_id, product_quantity);
        if (!create_franchise_transaction) {
            logger.error(`--- Franchise transaction not created with franchise inventory id ${franchise_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Franchise transaction not created with franchise inventory id ${id}`);
        }
        logger.info(`--- Franchise transaction created with franchise inventory id ${franchise_id} ---`);
        return returnResponse(res, StatusCodes.OK, `Provider product updated successfully`, updated_provider_product);
    }
    catch (error) {
        logger.error(`--- Error in updateProviderProductEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { updateProviderProductEndpoint };