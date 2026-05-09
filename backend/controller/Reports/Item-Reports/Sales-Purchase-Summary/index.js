import {getProviderByUserId, getProviderProducts } from "./query.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getSalesPurchaseSummaryEndpoint =  async (req , res) => {
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

        const { category_id , start_date , end_date} = req.query;
        logger.info(`--- Fetching products for provider : ${provider.id} ---`);
        const products = await getProviderProducts(provider.id ,franchise_id ,  category_id, start_date , end_date);
        if (!products) {
            return returnError(res, StatusCodes.NOT_FOUND, `Products not found for provider : ${provider.id}`);
        }
        logger.info(`--- Products found for provider : ${provider.id} ---`);

         const summary = products.map(product => ({
      item: product.product_name,
      sale_quantity: product.SalesPart.reduce((sum, sale) => sum + sale.part_quantity, 0),
      purchase_quantity: product.PurchasePart.reduce((sum, purchase) => sum + purchase.part_quantity, 0),
    }));
        return returnResponse(res, StatusCodes.OK, `Products fetched successfully`, summary);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getSalesPurchaseSummaryEndpoint };