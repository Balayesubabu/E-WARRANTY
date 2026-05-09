import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, deleteFranchiseInventory } from "./query.js";

const deleteProductEndpoint = async (req, res) => {
    try {
        logger.info(`deleteProductEndpoint`);

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

        const product_id = req.params.franchise_inventory_id;
        let product;

        logger.info(`--- Deleting product with product_id : ${product_id} ---`);
        try{
            product = await deleteFranchiseInventory(product_id);
            if (!product) {
            logger.error(`--- Product not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Product not found", null);
            }
        } catch (error) {
            logger.error(`--- Error deleting product: ${error.message} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Franchise inventory cannot be deleted as it is linked with other records");
        }
        
        logger.info(`--- Product deleted ---`);

        return returnResponse(res, StatusCodes.OK, "Product deleted successfully", product);
    } catch (error) {
        logger.error(`--- Error in deleteProductEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete product");
    }
}

export { deleteProductEndpoint };