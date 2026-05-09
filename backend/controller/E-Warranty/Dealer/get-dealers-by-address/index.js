import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderById, getDealersByAddress } from "./query.js";

const getDealersByAddressEndpoint = async (req, res) => {
    try {
        const { provider_id, pin_code, city } = req.body;

        if (!provider_id) {
            logger.info(`--- Provider ID is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Provider ID is required`);
        }

        logger.info(`--- Checking if provider exists with id: ${provider_id} ---`);
        const provider = await getProviderById(provider_id);
        if (!provider) {
            logger.info(`--- Provider not found with id: ${provider_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with id: ${provider_id} ---`);

        // Clean up the input - treat empty strings as null
        const cleanPinCode = pin_code && pin_code.trim() !== "" ? pin_code.trim() : null;
        const cleanCity = city && city.trim() !== "" ? city.trim() : null;

        // If both search criteria are empty, we'll return all dealers for the provider
        if (!cleanPinCode && !cleanCity) {
            logger.info(`--- Both pin_code and city are empty, returning all dealers for provider ---`);
        }

        let searchCriteria = [];
        if (cleanPinCode) searchCriteria.push(`pincode: ${cleanPinCode} (including nearby)`);
        if (cleanCity) searchCriteria.push(`city: ${cleanCity}`);
        const searchMessage = searchCriteria.length > 0 ? `with criteria: ${searchCriteria.join(', ')}` : '';

        logger.info(`--- Fetching dealers by address ${searchMessage} ---`);
        const dealers = await getDealersByAddress(provider_id, cleanPinCode, cleanCity);
        if (!dealers || dealers.length === 0) {
            logger.info(`--- No dealers found ${searchMessage} ---`);
            return returnResponse(res, StatusCodes.OK, `No dealers found`, []);
        }
        logger.info(`--- Dealers found ${searchMessage} ---`);

        return returnResponse(res, StatusCodes.OK, `Dealers fetched successfully`, dealers);
    } catch (error) {
        logger.error(`getDealersByAddressEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get dealers by address`);
    }
}

export { getDealersByAddressEndpoint };