import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, searchWarrantyProductByName } from "./query.js";

const searchWarrantyProductByNameEndpoint = async (req, res) => {
    try {
        logger.info(`searchWarrantyProductByNameEndpoint`);

        if (req.type && req.type !== "provider" && req.type !== "staff") {
            return returnError(res, StatusCodes.FORBIDDEN, `Only owner or staff can manage warranty products`);
        }

        const provider = req.type === "staff"
            ? { id: req.provider_id }
            : await getProviderByUserId(req.user_id);
        console.log(provider);
        if (!provider || !provider.id) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with id : ${provider.id} ---`);

        const search_query = req.query.search_query;

        logger.info(`--- Searching warranty product with search_query : ${search_query} ---`);
        const warranty_products = await searchWarrantyProductByName(search_query);
        if (!warranty_products) {
            logger.error(`--- Warranty products not found with search_query : ${search_query} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Warranty products not found`);
        }
        logger.info(`--- Warranty products found with search_query : ${search_query} ---`);
        return returnResponse(res, StatusCodes.OK, `Warranty products fetched successfully`, warranty_products);

    } catch (error) {
        logger.error(`Error in searchWarrantyProductByNameEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in searchWarrantyProductByNameEndpoint`);
    }
};

export default searchWarrantyProductByNameEndpoint;