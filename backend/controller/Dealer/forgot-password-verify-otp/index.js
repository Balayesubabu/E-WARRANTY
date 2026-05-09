import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { generateDealerJWT } from "../../../services/generate-jwt-token.js";
import verifyOTP from "../../../services/verify-otp.js";
import { getDealerByEmailOrPhoneNumber } from "./query.js";

const dealerForgotPasswordVerifyOTPEndpoint = async (req, res) => {
    try {
        logger.info(`dealerForgotPasswordVerifyOTPEndpoint`);
        const { email, phone_number, otp } = req.body;

        logger.info(`--- Checking if dealer exists with email ${email} or phone number ${phone_number} ---`);
        const dealer = await getDealerByEmailOrPhoneNumber(email, phone_number);
        if (!dealer) {
            logger.error(`--- Dealer not found with email ${email} or phone number ${phone_number} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found", { verified: false });
        }
        logger.info(`--- Dealer found with email ${email} or phone number ${phone_number} ---`);

        logger.info(`--- Checking if OTP is correct ---`);
        const isOTPCorrect = await verifyOTP(dealer, otp);
        if (!isOTPCorrect) {
            logger.error(`--- OTP is incorrect ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "OTP is incorrect", { verified: false });
        }
        logger.info(`--- OTP is correct ---`);

        logger.info(`--- Generating JWT for dealer ${dealer.id} ---`);
        const token = await generateDealerJWT(dealer.id);
        logger.info(`--- JWT generated for dealer ${dealer.id} ---`);

        return returnResponse(res, StatusCodes.OK, "OTP is correct", { verified: true, token: token });

    } catch (error) {
        logger.error(`Error in dealerForgotPasswordVerifyOTPEndpoint:`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error verifying OTP");
    }
}

export { dealerForgotPasswordVerifyOTPEndpoint };
