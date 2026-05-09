import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getUserByEmailOrPhoneNumber, updateUserVerified, getProviderByUserId, getFranchisesByProviderId, checkUserSubscription   } from "./query.js";
import {generateJWT} from "../../../services/generate-jwt-token.js";

const verifyOTPEndpoint = async (req, res) => {
    try {
        logger.info("verifyOTP");
        const { email, phone_number, otp, is_registered } = req.body;

        logger.info(`--- Checking if email or phone number is provided ---`);
        if (!email && !phone_number) {
            logger.info(`--- Email or phone number is not provided ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "Email or phone number is required");
        }
        logger.info(`--- Email or phone number is provided ---`);

        logger.info(`--- Checking if OTP is provided ---`);
        if (!otp) {
            logger.info(`--- OTP is not provided ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "OTP is required");
        }
        logger.info(`--- OTP is provided ---`);

        logger.info(`--- Checking if user exists with email ${email} or phone number ${phone_number} ---`);
        const user = await getUserByEmailOrPhoneNumber(email, phone_number);
        if (!user) {
            logger.info(`--- User does not exist with email ${email} or phone number ${phone_number} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "User does not exist");
        }
        logger.info(`--- User exists with email ${email} or phone number ${phone_number} ---`);

        logger.info(`--- Checking if OTP is correct ---`);
        if (user.otp !== `${otp}`) {
            logger.info(`--- OTP is incorrect ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "OTP is incorrect");
        }
        logger.info(`--- OTP is correct ---`);

        logger.info(`--- Checking if OTP has expired ---`);
        if (user.otp_expiry < new Date()) {
            logger.info(`--- OTP has expired ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "OTP has expired");
        }
        logger.info(`--- OTP is valid ---`);

        logger.info(`--- Setting user as verified ---`);
        const user_updated = await updateUserVerified(user.id);
        if (!user_updated) {
            logger.info(`--- User verification failed ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "User verification failed");
        }
        logger.info(`--- User verified ---`);

        logger.info(`--- Generating JWT token for user with email ${email} or phone number ${phone_number} ---`);
        const token = await generateJWT(user.id);
        if (!token) {
            logger.info(`--- JWT token generation failed ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "JWT token generation failed");
        }
        logger.info(`--- JWT token generated ---`);

        if (!is_registered) {
            return returnResponse(res, StatusCodes.OK, "OTP is valid", { verified: true, token: token });
        }

        logger.info (`--- Getting provider for user with user_id ${user.id} ---`);
        const provider = await getProviderByUserId(user.id);
        if (!provider) {
            logger.error(`--- No provider found for user with user_id ${user.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "No provider found");
        }
        logger.info(`--- Provider for user with user_id ${user.id} fetched ---`);

         logger.info(`--- Getting franchises for provider ${provider.id} ---`);
        const franchiseOne = await getFranchisesByProviderId(provider.id);
        if (!franchiseOne) {
            logger.error(`--- No franchises found for provider ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "No franchises found");
        }
        logger.info(`--- Franchises for provider ${provider.id} fetched ---`);
        
        logger.info(`--- Checking user subscription status ---`);
        const subscription = await checkUserSubscription(provider.id);
        logger.info(`--- User subscription status checked ---`);

        let isSubscriptionActive = false;
        if (subscription) {
            logger.info(`--- User has a subscription plans with id ${JSON.stringify(subscription)} ---`);

            logger.info(`--- Checking if subscription is active `);

            if (subscription.is_base_plan_active &&
                subscription.end_date > new Date() &&
                subscription.is_cancelled === false &&
                subscription.is_active === true
            ) {
                logger.info(`--- Subscription is active ---`);
                isSubscriptionActive = true;
            } else {
                logger.info(`--- User does not have a subscription ---`);
            }
        }



        return returnResponse(res, StatusCodes.OK, "OTP is valid", { verified: true, token: token, isSubscriptionActive, franchiseOne});
    } catch (error) {
        logger.error(error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
    }
}

export { verifyOTPEndpoint };