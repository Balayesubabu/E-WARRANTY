import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getWarrantyProducts } from "./query.js";

const getWarrantyProductsEndpoint = async (req, res) => {
    try {
        logger.info(`getWarrantyProductsEndpoint`);

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

        logger.info(`--- Getting warranty products with provider_id : ${provider.id} ---`);
        const warranty_products = await getWarrantyProducts(provider.id);
        if (!warranty_products) {
            logger.error(`--- Warranty products not found with provider_id : ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Warranty products not found`);
        }
        logger.info(`--- Warranty products found with provider_id : ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Warranty products fetched successfully`, warranty_products);
    } catch (error) {
        logger.error(`Error in getWarrantyProductsEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getWarrantyProductsEndpoint`);
    }
};

export default getWarrantyProductsEndpoint;