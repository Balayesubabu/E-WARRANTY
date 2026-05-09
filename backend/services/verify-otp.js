import { logger } from "./logger.js"

const verifyOTP = async (user, otp) => {
    logger.info("verifyOTP");
    logger.info(`--- Checking if user and otp are provided ---`);
    if (!user || !otp) {
        logger.info(`--- User or otp is not provided ---`);
        throw new Error("User and otp are required");
    }
    logger.info(`--- User and otp are provided ---`);

    logger.info(`--- Verifying OTP for user ${user.id} ---`);

    if (user.otp !== otp) {
        logger.info(`--- OTP is incorrect ---`);
        return false;
    }
    logger.info(`--- OTP is correct ---`);

    if (user.otp_expiry < new Date()) {
        logger.info(`--- OTP has expired ---`);
        return false;
    }
    logger.info(`--- OTP is valid ---`);

    return true;
}

export default verifyOTP;