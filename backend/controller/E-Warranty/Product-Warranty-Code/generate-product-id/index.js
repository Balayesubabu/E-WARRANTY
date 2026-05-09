import { getProviderByUserId } from "./query.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { generateNanoId } from "../../../../services/generate-nano-id.js";

const generateProductIdEndpoint = async (req, res) => {
    try {
        logger.info(`generateProductIdEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider by user id ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with user id: ${user_id} ---`);

        const product_id = generateNanoId("Numeric", 12);

        return returnResponse(res, StatusCodes.OK, `Product id generated successfully`, { product_id });
    } catch (error) {
        logger.error(`generateProductIdEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to generate product id`);
    }
}

export { generateProductIdEndpoint };