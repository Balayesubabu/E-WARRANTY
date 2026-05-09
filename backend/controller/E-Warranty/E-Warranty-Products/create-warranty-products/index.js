import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, createWarrantyProduct } from "./query.js";
import { debitForAction, checkBalance } from "../../../../services/coinService.js";

const createWarrantyProductsEndpoint = async (req, res) => {
    try {
        logger.info(`createWarrantyProductsEndpoint`);

        if (req.type && req.type !== "provider" && req.type !== "staff") {
            return returnError(res, StatusCodes.FORBIDDEN, `Only owner or staff can manage warranty products`);
        }

        const provider = req.type === "staff"
            ? { id: req.provider_id }
            : await getProviderByUserId(req.user_id);
        if (!provider || !provider.id) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with id : ${provider.id} ---`);

        // Check coin balance before creating product
        const coinCheck = await checkBalance(provider.id, "ADD_PRODUCT", 1);
        if (!coinCheck.allowed) {
            logger.warn(`Insufficient coins for ADD_PRODUCT: ${coinCheck.current} < ${coinCheck.required}`);
            return returnError(
                res, 
                StatusCodes.PAYMENT_REQUIRED, 
                `Insufficient coins. You need ${coinCheck.required} coins to add a product. Current balance: ${coinCheck.current}.`,
                { 
                    error_code: "INSUFFICIENT_COINS",
                    required: coinCheck.required,
                    current: coinCheck.current
                }
            );
        }

        const data = req.body;

        const {
            current_product_factory_number,
            product_type,
            product_name,
            product_id,
            warranty_period,
            warranty_check,
            warranty_check_interval,
            terms_and_conditions,
            link
        } = data;

        logger.info(`--- Creating warranty product with data : ${JSON.stringify(data)} ---`);
        const warranty_product = await createWarrantyProduct({
            provider_id: provider.id,
            current_product_factory_number,
            product_type,
            product_name,
            product_id,
            warranty_period,
            warranty_check,
            warranty_check_interval,
            terms_and_conditions,
            link
        });
        if (!warranty_product) {
            logger.error(`--- Warranty product not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Warranty product not created`);
        }
        logger.info(`--- Warranty product created with id : ${warranty_product.id} ---`);

        // Deduct coins for creating product
        try {
            await debitForAction(
                provider.id, 
                "ADD_PRODUCT", 
                `Added product: ${product_name}`,
                1,
                { reference_id: warranty_product.id, reference_type: "product" }
            );
            logger.info(`--- Coins debited for product creation ---`);
        } catch (coinError) {
            logger.error(`Failed to debit coins: ${coinError.message}`);
        }

        return returnResponse(res, StatusCodes.OK, `Warranty product created successfully`, warranty_product);
    } catch (error) {
        logger.error(`Error in createWarrantyProductsEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in createWarrantyProductsEndpoint`);
    }
};

export default createWarrantyProductsEndpoint;