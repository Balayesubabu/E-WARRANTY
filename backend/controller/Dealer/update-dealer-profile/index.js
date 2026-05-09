import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getDealerById, updateDealerProfile } from "./query.js";

/**
 * Update dealer's own profile
 * PUT /dealer/update-profile
 * Uses req.dealer_id set by verifyLoginToken middleware
 * Dealers can update: name, phone_number, address, city, state, country, pin_code
 * Dealers CANNOT update: email, password, is_active, is_deleted (those need owner/admin)
 */
const updateDealerProfileEndpoint = async (req, res) => {
    try {
        logger.info("updateDealerProfileEndpoint");

        const dealer_id = req.dealer_id;
        if (!dealer_id) {
            logger.error("--- Dealer ID not found in request ---");
            return returnError(res, StatusCodes.BAD_REQUEST, "Dealer ID not found. Please login as a dealer.");
        }

        // Verify dealer exists
        logger.info(`--- Checking if dealer exists with id: ${dealer_id} ---`);
        const dealer = await getDealerById(dealer_id);
        if (!dealer) {
            logger.error(`--- Dealer not found with id: ${dealer_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
        }

        const { name, phone_number, country_code, address, pin_code, city, state, country } = req.body;

        if (!name) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Name is required");
        }

        logger.info(`--- Updating dealer profile for dealer_id: ${dealer_id} ---`);
        const updatedDealer = await updateDealerProfile(dealer_id, {
            name: name || dealer.name,
            phone_number: phone_number || dealer.phone_number,
            country_code: country_code || dealer.country_code,
            address: address !== undefined ? address : dealer.address,
            pin_code: pin_code !== undefined ? pin_code : dealer.pin_code,
            city: city !== undefined ? city : dealer.city,
            state: state !== undefined ? state : dealer.state,
            country: country !== undefined ? country : dealer.country,
        });

        if (!updatedDealer) {
            logger.error(`--- Failed to update dealer profile ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update profile");
        }

        logger.info("--- Dealer profile updated successfully ---");

        // Also update localStorage data hint in the response
        return returnResponse(res, StatusCodes.OK, "Profile updated successfully", updatedDealer);
    } catch (error) {
        logger.error(`updateDealerProfileEndpoint error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update dealer profile");
    }
};

export { updateDealerProfileEndpoint };
