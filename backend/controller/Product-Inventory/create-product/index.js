import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { uploadSingleImage } from "../../../services/upload.js";
import { getProviderByUserId, createProduct } from "./query.js";
import {FranchiseInventoryTransaction} from "../../../prisma/db-models.js";

const createProductEndpoint = async (req, res) => {
    try {
        logger.info(`createProductEndpoint`);
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

        logger.info(`--- Creating product ---`);
        const data = req.body;

        const {
            product_id,
            product_name,
            product_hsn_code,
            product_item_code,
            product_custom_code,
            product_description,
            product_images,
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
            category_id,
        } = data;

        logger.info(`--- Calculating product gst amount and total price ---`);
        logger.info(`--- Product gst amount and total price calculated ---`);

        logger.info(`--- Creating product with data ${JSON.stringify(data)} ---`);
        const product = await createProduct(data, product_images,provider.id, franchise_id, staff_id);
        if (!product) {
            logger.error(`--- Product not created with data ${JSON.stringify(data)} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Product not created with data ${JSON.stringify(data)}`);
        }
        logger.info(`--- Product created with data ${JSON.stringify(product)} ---`);
        console.log(product.id)
             const createFranchiseTransaction = await FranchiseInventoryTransaction.create({
                    data: {
                        provider_id: provider.id,
                        franchise_id: franchise_id,
                        franchise_inventory_id: product.id,
                        quantity: product_quantity,
                        action: "add",
                        closing_stock : product_quantity,
                        stock_changed_by : "self",
        
                    }
                });
                if (!createFranchiseTransaction) {
                    logger.error(`--- Franchise transaction not created with franchise inventory id ${franchise_id} ---`);
                    return returnError(res, StatusCodes.NOT_FOUND, `Franchise transaction not created with franchise inventory id ${id}`);
                }
                logger.info(`--- Franchise transaction created with franchise inventory id ${franchise_id} ---`);

        return returnResponse(res, StatusCodes.CREATED, `Product created successfully`, product);
    } catch (error) {
        logger.error(`--- Error in createProductEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { createProductEndpoint };
