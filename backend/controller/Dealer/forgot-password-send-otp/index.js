import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { generateOTPForDealer } from "../../../services/generate-otp.js";
import { sendEmail } from "../../../services/email.js";
import sendSMS from "../../../services/sms.js";
import { getDealerByEmailOrPhoneNumber } from "./query.js";

const dealerForgotPasswordSendOTPEndpoint = async (req, res) => {
    try {
        logger.info(`dealerForgotPasswordSendOTPEndpoint`);
        const { email, phone_number } = req.body;

        logger.info(`--- Checking if dealer exists with email ${email} or phone number ${phone_number} ---`);
        const dealer = await getDealerByEmailOrPhoneNumber(email, phone_number);
        if (!dealer) {
            logger.error(`--- Dealer not found with email ${email} or phone number ${phone_number} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
        }
        logger.info(`--- Dealer found with email ${email} or phone number ${phone_number} ---`);

        logger.info(`--- Generating OTP for dealer ---`);
        const otpData = await generateOTPForDealer(phone_number || dealer.phone_number);
        logger.info(`--- OTP generated for dealer ---`);

        // Log OTP clearly in console for development
        console.log(`\n========================================`);
        console.log(`  DEALER OTP for ${email || phone_number}: ${otpData.otp}`);
        console.log(`  Expires at: ${otpData.otp_expiry}`);
        console.log(`========================================\n`);

        // Send OTP via email or SMS (non-blocking so API responds even if delivery fails)
        if (email) {
            logger.info(`--- Sending OTP to email ${email} ---`);
            sendEmail(email, "OTP for forgot password", 'Your OTP for password reset is ' + otpData.otp + '. This OTP is valid for ' + (process.env.OTP_EXPIRY_TIME || 5) + ' minutes. --Team eWarranty')
                .then(() => logger.info(`--- OTP sent to email ${email} ---`))
                .catch((err) => logger.error(`--- Failed to send OTP email to ${email}: ${err.message} ---`));
        } else if (phone_number) {
            logger.info(`--- Sending OTP to phone number ${phone_number} ---`);
            sendSMS(phone_number, 'Phone+Validation+From+eWarranty&var1=' + otpData.otp)
                .then(() => logger.info(`--- OTP sent to phone number ${phone_number} ---`))
                .catch((err) => logger.error(`--- Failed to send OTP SMS to ${phone_number}: ${err.message} ---`));
        }

        return returnResponse(res, StatusCodes.OK, "OTP sent to email or phone number", { expiresInMs: (parseInt(process.env.OTP_EXPIRY_TIME) || 5) * 60 * 1000 });

    } catch (error) {
        logger.error(`Error in dealerForgotPasswordSendOTPEndpoint:`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error sending OTP");
    }
}

export { dealerForgotPasswordSendOTPEndpoint };
