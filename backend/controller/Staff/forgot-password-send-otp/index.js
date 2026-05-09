import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { generateOTPForStaff } from "../../../services/generate-otp.js";
import { sendEmail } from "../../../services/email.js";
import sendSMS from "../../../services/sms.js";
import { getStaffByEmailOrPhoneNumber } from "./query.js";

const forgotPasswordSendOTPEndpoint = async (req, res) => {
    try {
        logger.info(`forgotPasswordSendOTPEndpoint`);
        const { email, phone_number } = req.body;
        console.log(email, phone_number);
        logger.info(`--- Checking if user exists with email ${email} or phone number ${phone_number} ---`);
        const user = await getStaffByEmailOrPhoneNumber(email, phone_number);
        if (!user) {
            logger.error(`--- User not found with email ${email} or phone number ${phone_number} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "User not found");
        }
        logger.info(`--- User found with email ${email} or phone number ${phone_number} ---`);

        logger.info(`--- Generating OTP for email ${email} or phone number ${phone_number} ---`);
        const otpData = await generateOTPForStaff(phone_number || user.phone);
        logger.info(`--- OTP generated for email ${email} or phone number ${phone_number} ---`);

        // Log OTP clearly in console for development
        console.log(`\n========================================`);
        console.log(`  STAFF OTP for ${email || phone_number}: ${otpData.otp}`);
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
            sendSMS(phone_number,'Phone+Validation+From+GVCC&var1='+otpData.otp)
                .then(() => logger.info(`--- OTP sent to phone number ${phone_number} ---`))
                .catch((err) => logger.error(`--- Failed to send OTP SMS to ${phone_number}: ${err.message} ---`));
        }

        return returnResponse(res, StatusCodes.OK, "OTP sent to email or phone number", { expiresInMs: (parseInt(process.env.OTP_EXPIRY_TIME) || 5) * 60 * 1000 });

    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error forgot password");
    }
}

export { forgotPasswordSendOTPEndpoint };  