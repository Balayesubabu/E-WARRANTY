import { getProviderByUserId, getProviderProducts } from "./query.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getItemReportByPartyEndpoint = async (req, res) => {
    try {
        logger.info(`get user id`);
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
        logger.info(`user id is ${user_id}`);

        logger.info(`--- Fetching provider by user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${user_id} ---`);

        const { provider_customer_id, start_date, end_date } = req.query;
        console.log(`--- start date is ${start_date} and end date is ${end_date} and customer id is ${provider_customer_id} ---`);
        logger.info(`--- Fetching products for provider : ${provider.id} ---`);
        const products = await getProviderProducts(provider.id,franchise_id, provider_customer_id, start_date, end_date);
        if (!products) {
            return returnError(res, StatusCodes.NOT_FOUND, `Products not found for provider : ${provider.id}`);
        }
        logger.info(`--- Products found for provider : ${provider.id} ---`);

        // const summary = products.map(product => ({
        //     itemName: product.product_name,
        //     itemCode: product.product_item_code,
        //     categoryName: product.categoryName,
        //     saleQuantity: product.SalesPart.reduce((sum, sale) => sum + sale.part_quantity, 0),
        //     saleAmount: product.SalesPart.reduce((sum, sale) => sum + (sale.part_total_price || 0), 0),
        //     purchaseQuantity: product.PurchasePart.reduce((sum, purchase) => sum + purchase.part_quantity, 0),
        //     purchaseAmount: product.PurchasePart.reduce((sum, purchase) => sum + (purchase.part_total_price || 0), 0),
        //     productUnit: product.product_measuring_unit
        // }));
        const summary = products.map(product => ({
            item_Name: product.product_name,
            item_Code: product.product_item_code,
            category_Name: product.categoryName,
            sale_Quantity: product.SalesPart.reduce((sum, sale) => sum + sale.part_quantity, 0),
            sale_Amount: parseFloat(
                Number(product.SalesPart.reduce((sum, sale) => sum + (sale.part_total_price || 0), 0)).toFixed(2)
            ),
            purchase_Quantity: product.PurchasePart.reduce((sum, purchase) => sum + purchase.part_quantity, 0),
            purchase_Amount: parseFloat(
                Number(product.PurchasePart.reduce((sum, purchase) => sum + (purchase.part_total_price || 0), 0)).toFixed(2)
            ),
            product_Unit: product.product_measuring_unit
        }));
        return returnResponse(res, StatusCodes.OK, `Products fetched successfully`, summary);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getItemReportByPartyEndpoint };