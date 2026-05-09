import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getWarrantyProductById, deleteWarrantyProduct } from "./query.js";

const deleteWarrantyProductsEndpoint = async (req, res) => {
    try {
        logger.info(`deleteWarrantyProductsEndpoint`);

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

        const warranty_product_id = req.params.warranty_product_id;

        logger.info(`--- Getting warranty product with id : ${warranty_product_id} ---`);
        const warranty_product = await getWarrantyProductById(warranty_product_id);
        if (!warranty_product) {
            logger.error(`--- Warranty product not found with id : ${warranty_product_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Warranty product not found`);
        }
        logger.info(`--- Warranty product found with id : ${warranty_product_id} ---`);

        logger.info(`--- Deleting warranty product with id : ${warranty_product_id} ---`);
        const deleted_warranty_product = await deleteWarrantyProduct(warranty_product_id);
        if (!deleted_warranty_product) {
            logger.error(`--- Warranty product not deleted with id : ${warranty_product_id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Warranty product not deleted`);
        }
        logger.info(`--- Warranty product deleted with id : ${warranty_product_id} ---`);

        return returnResponse(res, StatusCodes.OK, `Warranty product deleted successfully`, deleted_warranty_product);
    } catch (error) {
        logger.error(`Error in deleteWarrantyProductsEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in deleteWarrantyProductsEndpoint`);
    }
};

export default deleteWarrantyProductsEndpoint;