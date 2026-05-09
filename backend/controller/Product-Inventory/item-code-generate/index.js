import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getProviderByUserId,getItemcodeFromProvider} from "./query.js";
import crypto from "crypto";

const generateItemCode = () => {
    const buffer = crypto.randomBytes(8); // 8 bytes = 64 bits
    const number = buffer.readBigInt64BE(); // No need for second param

    const min = 1_000_000_000_000n;
    const max = 9_999_999_999_999n;

    // Ensure number is positive
    const positiveNumber = number < 0n ? -number : number;

    const itemCode = min + (positiveNumber % (max - min + 1n));

    // Return as string, padded to 13 digits
    return itemCode.toString().padStart(13, "0");
};

const itemCodeGenerateEndpoint = async (req, res) => {
    try {
        logger.info(`itemCodeGenerateEndpoint`);

        let user_id;
        let staff_id;

        if (req.type === 'staff') {
            user_id = req.user_id;
            staff_id = req.staff_id;
        } else if (req.type === 'provider') {
            user_id = req.user_id;
            staff_id = null;
        }

        const { number } = req.params; // Number of item codes to generate
        const franchise_id = req.franchise_id;

        logger.info(`--- Fetching provider by user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found", null);
        }
        logger.info(`--- Provider found ---`);

        logger.info(`--- Generating ${number} unique item codes ---`);

        const itemCodeList = new Set(); // Use a Set to avoid duplicates locally

        let attempts = 0;
        const maxAttempts = number * 10; // Safety limit to avoid infinite loops

        while (itemCodeList.size < number && attempts < maxAttempts) {
            attempts++;
            const item_code = generateItemCode();

            // Check database for uniqueness
            const exists = await getItemcodeFromProvider(provider.id, item_code, franchise_id);
            if (!exists && !itemCodeList.has(item_code)) {
                itemCodeList.add(item_code);
            }
        }

        if (itemCodeList.size < number) {
            logger.error(`--- Could not generate enough unique item codes after ${attempts} attempts ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Could not generate enough unique item codes. Please try again.", null);
        }

        logger.info(`--- Successfully generated ${itemCodeList.size} item codes ---`);
        return returnResponse(
            res,
            StatusCodes.OK,
            "Item codes generated successfully",
            Array.from(itemCodeList)
        );

    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

export default itemCodeGenerateEndpoint;