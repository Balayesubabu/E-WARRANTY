import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getUserByEmailOrPhoneNumber, createUser } from "./query.js";
import { generateOTP } from "../../../services/generate-otp.js";
import { sendEmail } from "../../../services/email.js";
import sendSMS from "../../../services/sms.js";
import { Provider } from "../../../prisma/db-models.js";
import {
  normalizeEmailForIdentity,
  findGlobalEmailLoginConflict,
  GLOBAL_EMAIL_IN_USE_MESSAGE,
} from "../../../utils/globalEmailIdentity.js";

const generateOTPEndpoint = async (req, res) => {
    try {
        logger.info("generateOTP");
        const { email, phone_number, country_code, is_registered } = req.body;

        let user;
        if (is_registered === false) {
            logger.info(`--- Checking if email or phone number is provided ---`);
            if (!email && !phone_number) {
                logger.info(`--- Email or phone number is not provided ---`);
                return returnError(res, StatusCodes.BAD_REQUEST, "Email or phone number is required");
            }
            logger.info(`--- Email or phone number is provided ---`);

            logger.info(`--- Checking if user exists with email ${email} or phone number ${phone_number} ---`);
            user = await getUserByEmailOrPhoneNumber(email, phone_number);
            if (!user) {
                logger.info(`--- User does not exist with email ${email} or phone number ${phone_number} ---`);
                const emailNorm = normalizeEmailForIdentity(email);
                if (emailNorm) {
                    const reserved = await findGlobalEmailLoginConflict(emailNorm, {});
                    if (reserved) {
                        return returnError(res, StatusCodes.CONFLICT, GLOBAL_EMAIL_IN_USE_MESSAGE, {
                            code: "GLOBAL_EMAIL_IN_USE",
                            existingRole: reserved,
                        });
                    }
                }
                logger.info(`--- Creating User with email ${email} or phone number ${phone_number} ---`);
                user = await createUser(emailNorm || email, phone_number, country_code);
                if (!user) {
                    logger.info(`--- User creation failed with email ${email} or phone number ${phone_number} ---`);
                    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "User creation failed");
                }
                logger.info(`--- User created with email ${email} or phone number ${phone_number} ---`);
            }
            logger.info(`--- User exists with email ${email} or phone number ${phone_number} ---`);

            if (user.is_otp_verified === true || user.is_phone_verified === true) {
                const existingProvider = await Provider.findFirst({ where: { user_id: user.id } });
                if (existingProvider) {
                    logger.info(`--- User is fully registered (has Provider). Blocking duplicate signup. ---`);
                    return returnError(res, StatusCodes.NOT_FOUND, "User is already verified and exists", null);
                }
                logger.info(`--- User is verified but has no Provider (draft). Allowing re-verification. ---`);
            }
        } else {
            logger.info(`--- User is registered ---`);

            user = await getUserByEmailOrPhoneNumber(email, phone_number);
            if (!user) {
                logger.info(`--- User does not exist with email ${email} or phone number ${phone_number} ---`);
                return returnError(res, StatusCodes.NOT_FOUND, "User does not exist", null);
            }
            logger.info(`--- User exists with email ${email} or phone number ${phone_number} ---`);
        }

        logger.info(`--- Generating OTP ---`);
        const otpData = await generateOTP(user.id);

        if (!otpData) {
            logger.info(`--- OTP generation failed ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "OTP generation failed", { otp: false });
        }
        logger.info(`--- OTP generated and stored in database ---`);

        // Send OTP via email or SMS (non-blocking so API responds even if delivery fails)
        if (email) {
            logger.info(`--- Sending OTP to email ${email} ---`);
            sendEmail(email, "Your OTP Verification Code", 'Your OTP verification code is ' + otpData.otp + '. This code is valid for ' + (process.env.OTP_EXPIRY_TIME || 5) + ' minutes. --Team eWarranty')
                .then(() => logger.info(`--- OTP sent to email ${email} ---`))
                .catch((err) => logger.error(`--- Failed to send OTP email to ${email}: ${err.message} ---`));
        }
        
        if (phone_number || user.phone_number) {
            const targetPhone = phone_number || user.phone_number;
            logger.info(`--- Sending OTP to phone ${targetPhone} ---`);
            sendSMS(targetPhone, 'Phone+Validation+From+GVCC&var1=' + otpData.otp)
                .then(() => logger.info(`--- OTP sent to phone ${targetPhone} ---`))
                .catch((err) => logger.error(`--- Failed to send OTP SMS to ${targetPhone}: ${err.message} ---`));
        }

        return returnResponse(res, StatusCodes.OK, "OTP generated successfully", { otp: true, expiresInMs: (parseInt(process.env.OTP_EXPIRY_TIME) || 5) * 60 * 1000 });

    } catch (error) {
        logger.error(error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "OTP generation failed", null);
    }
}

export { generateOTPEndpoint };