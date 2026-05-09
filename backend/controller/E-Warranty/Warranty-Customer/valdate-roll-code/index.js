import { StatusCodes } from "http-status-codes";
import { findWarrantyCode, checkIfRegistered } from "./query.js";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";

const valdateRollCodeEndpoint = async (req, res) => {
    try {
        logger.info(`valdateRollCodeEndpoint`);

        const { roll_code, provider_id } = req.body;

        if (!roll_code || !provider_id) {
            logger.error(`Missing required fields: roll_code or provider_id`);
            return returnError(res, StatusCodes.BAD_REQUEST, 'roll_code and provider_id are required');
        }

        logger.info(`--- Validating warranty code: ${roll_code} for provider: ${provider_id} ---`);

        // Step 1: Check if warranty code exists in the system for this provider
        const warrantyCode = await findWarrantyCode(roll_code, provider_id);

        if (!warrantyCode) {
            logger.info(`--- Warranty code not found for this provider ---`);
            return returnError(res, StatusCodes.NOT_FOUND, 'Warranty code not found. Please check the code and selected provider.');
        }

        logger.info(`--- Warranty code found: ${warrantyCode.id} ---`);

        // Step 2: Check if warranty code is already registered to a customer
        const isRegistered = await checkIfRegistered(roll_code);

        if (isRegistered) {
            logger.info(`--- Warranty code is already registered to a customer ---`);
            return returnResponse(res, StatusCodes.OK, 'This warranty code has already been registered.', {
                roll_code: roll_code,
                provider_id: provider_id,
                available: false,
                product_name: warrantyCode.product_name || null,
                warranty_code_status: warrantyCode.warranty_code_status || null,
            });
        }

        // Step 3: Code exists and is not registered — it's available
        logger.info(`--- Warranty code is valid and available ---`);
        return returnResponse(res, StatusCodes.OK, 'Warranty code is valid and available for registration.', {
            roll_code: roll_code,
            provider_id: provider_id,
            available: true,
            product_name: warrantyCode.product_name || null,
            warranty_days: warrantyCode.warranty_days || null,
            warranty_code_status: warrantyCode.warranty_code_status || null,
        });

    } catch (error) {
        logger.error(`--- Error in valdateRollCodeEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Internal Server Error');
    }
}

export { valdateRollCodeEndpoint };
