import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getDealerById, updateDealerPassword } from "./query.js";
import { generateDealerJWT } from "../../../services/generate-jwt-token.js";

const dealerChangePasswordEndpoint = async (req, res) => {
    try {
        logger.info(`dealerChangePasswordEndpoint`);
        const { old_password, new_password } = req.body;

        // verifyToken sets req.dealer_id for dealer users
        const dealer_id = req.dealer_id;

        if (!dealer_id) {
            logger.error(`--- dealer_id not found in request. This endpoint requires dealer authentication. ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Dealer authentication required`);
        }

        if (!old_password || !new_password) {
            logger.error(`--- old_password and new_password are required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Old password and new password are required`);
        }

        logger.info(`--- Checking if dealer exists with dealer_id: ${dealer_id} ---`);
        const dealer = await getDealerById(dealer_id);
        if (!dealer) {
            logger.error(`--- Dealer not found with dealer_id: ${dealer_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Dealer not found`);
        }
        logger.info(`--- Dealer found with dealer_id: ${dealer_id} ---`);

        logger.info(`--- Checking if old password is correct ---`);
        const is_password_correct = await bcrypt.compare(old_password, dealer.password);
        if (!is_password_correct) {
            logger.error(`--- Old password is incorrect ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Old password is incorrect`);
        }
        logger.info(`--- Old password is correct ---`);

        logger.info(`--- Hashing new password ---`);
        const hashed_password = await bcrypt.hash(new_password, 10);

        logger.info(`--- Updating dealer password for dealer_id: ${dealer_id} ---`);
        const updated_dealer = await updateDealerPassword(dealer_id, hashed_password);
        if (!updated_dealer) {
            logger.error(`--- Failed to update dealer password ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update dealer password`);
        }
        logger.info(`--- Dealer password updated for dealer_id: ${dealer_id} ---`);

        logger.info(`--- Generating new token for dealer_id: ${dealer_id} ---`);
        const new_token = await generateDealerJWT(dealer_id);

        return returnResponse(res, StatusCodes.OK, `Password updated successfully`, { token: new_token });

    } catch (error) {
        logger.error(`--- Error in dealerChangePasswordEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

export { dealerChangePasswordEndpoint };
