import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { generateStaffJWT } from "../../../services/generate-jwt-token.js";
import verifyOTP from "../../../services/verify-otp.js";
import { getStaffByEmailOrPhoneNumber } from "./query.js";

const forgotPasswordVerifyOTPEndpoint = async (req, res) => {
    try {
        logger.info(`forgotPasswordVerifyOTPEndpoint`);
        const { email, phone_number, otp } = req.body;

        logger.info(`--- Checking if user exists with email ${email} or phone number ${phone_number} ---`);
        const user = await getStaffByEmailOrPhoneNumber(email, phone_number);
        if (!user) {
            logger.error(`--- User not found with email ${email} or phone number ${phone_number} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "User not found", { verified: false });
        }
        logger.info(`--- User found with email ${email} or phone number ${phone_number} ---`);

        logger.info(`--- Checking if OTP is correct ---`);
        const isOTPCorrect = await verifyOTP(user, otp);
        if (!isOTPCorrect) {
            logger.error(`--- OTP is incorrect ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "OTP is incorrect", { verified: false });
        }
        logger.info(`--- OTP is correct ---`);

        logger.info(`--- Generating JWT for user ${user.id} ---`);
        const token = await generateStaffJWT(user.id);
        logger.info(`--- JWT generated for user ${user.id} ---`);

        return returnResponse(res, StatusCodes.OK, "OTP is correct", { verified: true, token: token });

    } catch (error) {
        logger.error(error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error forgot password");
    }
}

export { forgotPasswordVerifyOTPEndpoint };