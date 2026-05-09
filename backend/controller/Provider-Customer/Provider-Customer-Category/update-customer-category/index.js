import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, updateCustomerCategory } from "./query.js";

const updateCustomerCategoryEndpoint = async (req, res) => {
    try {
        logger.info(`updateCustomerCategoryEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider by user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found", null);
        }
        logger.info(`--- Provider found ---`);

        const customer_category_id = req.params.customer_category_id;

        const data = req.body;

        let {
            customer_category_name,
            customer_category_description,
            is_active,
            is_deleted
        } = data;

        if (data.is_deleted) {
            data.is_active = false;
            data.deleted_at = new Date();
        }

        logger.info(`--- Updating customer category by id : ${customer_category_id} ---`);
        const customer_category = await updateCustomerCategory(customer_category_id, data, provider.id);
        if (!customer_category) {
            logger.error(`--- Customer category not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Customer category not found", null);
        }
        logger.info(`--- Customer category updated ---`);

        return returnResponse(res, StatusCodes.OK, "Customer category updated successfully", customer_category);
    } catch (error) {
        logger.error(`--- Error in updateCustomerCategoryEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update customer category`);
    }
}

export { updateCustomerCategoryEndpoint };