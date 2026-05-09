import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, deleteCustomerCategory } from "./query.js";

const deleteCustomerCategoryEndpoint = async (req, res) => {
    try {
        logger.info(`deleteCustomerCategoryEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider by user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found", null);
        }
        logger.info(`--- Provider found ---`);

        const customer_category_id = req.params.customer_category_id;

        logger.info(`--- Deleting customer category by id : ${customer_category_id} ---`);
        const customer_category = await deleteCustomerCategory(customer_category_id);
        if (!customer_category) {
            logger.error(`--- Customer category not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Customer category not found", null);
        }
        logger.info(`--- Customer category deleted ---`);

        return returnResponse(res, StatusCodes.OK, "Customer category deleted successfully", customer_category);
    } catch (error) {
        logger.error(`--- Error in deleteCustomerCategoryEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to delete customer category`);
    }
}

export { deleteCustomerCategoryEndpoint };