import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import { getDealerById, updateDealerPassword } from "./query.js";

const dealerForgotResetPasswordEndpoint = async (req, res) => {
    try {
        logger.info(`dealerForgotResetPasswordEndpoint`);
        const { new_password } = req.body;

        // Get dealer_id from the verified token (set by verifyLoginToken middleware)
        const dealer_id = req.dealer_id || req.user_id;

        if (!dealer_id) {
            logger.error(`--- Dealer ID not found in request ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, "Unauthorized - Invalid token");
        }

        logger.info(`--- Checking if dealer exists with dealer_id: ${dealer_id} ---`);
        const dealer = await getDealerById(dealer_id);
        if (!dealer) {
            logger.error(`--- Dealer not found with dealer_id: ${dealer_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
        }
        logger.info(`--- Dealer found with dealer_id: ${dealer_id} ---`);

        logger.info(`--- Hashing new password ---`);
        const hashed_password = await bcrypt.hash(new_password, 10);

        logger.info(`--- Updating dealer with new password ---`);
        const updated_dealer = await updateDealerPassword(dealer_id, hashed_password);
        if (!updated_dealer) {
            logger.error(`--- Dealer not updated with new password ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update password");
        }
        logger.info(`--- Dealer password updated successfully ---`);

        return returnResponse(res, StatusCodes.OK, "Password updated successfully");
    } catch (error) {
        logger.error(`Error in dealerForgotResetPasswordEndpoint:`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error resetting password");
    }
}

export { dealerForgotResetPasswordEndpoint };
