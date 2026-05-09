import{ getProviderByUserId , getProviderProducts } from "./query.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

 const getLowStockSummaryEndPoint = async (req, res) => {
    try {
        logger.info(`LowStockSummary`);
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

        logger.info(`--- Fetching provider by user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found", null);
        }
        logger.info(`--- Provider found ---`);

        logger.info(`--- Fetching products for provider : ${provider.id} ---`);
        const products = await getProviderProducts(provider.id, franchise_id);
        if (!products) {
            logger.error(`--- Products not found for provider : ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Products not found", null);
        }
        logger.info(`--- Products found for provider : ${provider.id} ---`);

        const eachProduct = [];
        const filteredProducts = products.filter(product => product.product_quantity <= product.product_low_stock_level);
        
        filteredProducts.forEach((product) => {
            eachProduct.push({
                product_item_code: product.product_item_code,
                product_name: product.product_name,
                product_selling_price: product.product_selling_price || 0,
                product_purchase_price: product.product_purchase_price || 0,
                product_original_price: product.product_original_price,
                product_total_price: Number(product.product_total_price.toFixed(2)),
                product_quantity: product.product_quantity,
                product_low_stock_level: product.product_low_stock_level,
                 stock_value : Number((product.product_quantity * product.product_purchase_price).toFixed(2))
            })
        });
               

        return returnResponse(res, StatusCodes.OK, "Products found",  eachProduct );
    } catch (error) {
        logger.error(`--- Error in LowStockSummary ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error", null);
    }
};

export { getLowStockSummaryEndPoint };