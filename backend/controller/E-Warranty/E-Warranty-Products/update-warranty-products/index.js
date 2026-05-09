import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getWarrantyProductByGroupId, updateWarrantyProductTerms } from "./query.js";

const updateWarrantyProductsEndpoint = async (req, res) => {
    try {
        logger.info(`updateWarrantyProductsEndpoint`);

        if (req.type && req.type !== "provider" && req.type !== "staff") {
            return returnError(res, StatusCodes.FORBIDDEN, `Only owner or staff can manage warranty products`);
        }
        const { group_id, terms_and_conditions_link, terms_and_conditions } = req.body;

        if (!group_id) {
            logger.error(`--- Group ID is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Group ID is required`);
        }

        if (!terms_and_conditions_link && !terms_and_conditions) {
            logger.error(`--- No update fields provided ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `At least one field (terms_and_conditions_link or terms_and_conditions) must be provided`);
        }

        const provider = req.type === "staff"
            ? { id: req.provider_id }
            : await getProviderByUserId(req.user_id);
        if (!provider || !provider.id) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with id : ${provider.id} ---`);

        logger.info(`--- Getting warranty products with group_id : ${group_id} and provider_id : ${provider.id} ---`);
        const warranty_products = await getWarrantyProductByGroupId(group_id, provider.id);
        if (!warranty_products || warranty_products.length === 0) {
            logger.error(`--- No warranty products found with group_id : ${group_id} and provider_id : ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No warranty products found`);
        }
        logger.info(`--- Found ${warranty_products.length} warranty products ---`);

        const data = { terms_and_conditions_link, terms_and_conditions };

        logger.info(`--- Updating ${warranty_products.length} warranty products ---`);
        const updated_warranty_products = await updateWarrantyProductTerms(group_id, provider.id, data);
        
        if (!updated_warranty_products) {
            logger.error(`--- Warranty products not updated ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Warranty products not updated`);
        }
        logger.info(`--- ${updated_warranty_products.count} warranty products updated successfully ---`);

        return returnResponse(res, StatusCodes.OK, `${updated_warranty_products.count} warranty products updated successfully`, updated_warranty_products);
    } catch (error) {
        logger.error(`Error in updateWarrantyProductsEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updateWarrantyProductsEndpoint`);
    }
};

export default updateWarrantyProductsEndpoint;
