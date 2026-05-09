import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getDealerById } from "./query.js";

/**
 * Get dealer's own profile
 * GET /dealer/get-profile
 * Uses req.dealer_id set by verifyLoginToken middleware
 */
const getDealerProfileEndpoint = async (req, res) => {
    try {
        logger.info("getDealerProfileEndpoint");

        const dealer_id = req.dealer_id;
        if (!dealer_id) {
            logger.error("--- Dealer ID not found in request ---");
            return returnError(res, StatusCodes.BAD_REQUEST, "Dealer ID not found. Please login as a dealer.");
        }

        logger.info(`--- Fetching dealer profile for dealer_id: ${dealer_id} ---`);
        const dealer = await getDealerById(dealer_id);
        if (!dealer) {
            logger.error(`--- Dealer not found with id: ${dealer_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Dealer profile not found");
        }

        logger.info("--- Dealer profile fetched successfully ---");
        return returnResponse(res, StatusCodes.OK, "Dealer profile fetched successfully", dealer);
    } catch (error) {
        logger.error(`getDealerProfileEndpoint error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to get dealer profile");
    }
};

export { getDealerProfileEndpoint };
