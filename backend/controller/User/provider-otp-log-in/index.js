import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {generateJWT} from "../../../services/generate-jwt-token.js";
import verifyOTP from "../../../services/verify-otp.js";
import { getUserByPhoneNumber, checkUserSubscription,getFranchisesByProviderId,getProviderByUserId} from "./query.js";

const providerOTPLogIn = async (req, res) => {
    try {
        logger.info("providerOTPLogIn");
        const { phone_number, otp } = req.body;

        logger.info(`--- Checking if phone number and OTP are provided ---`);
        if (!phone_number || !otp) {
            logger.info(`--- Phone number or OTP is not provided ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, "Phone number and OTP are required");
        }
        logger.info(`--- Phone number and OTP are provided ---`);

        logger.info(`--- Checking if user exists with phone number ${phone_number} ---`);
        const user = await getUserByPhoneNumber(phone_number);

        if (!user) {
            logger.info(`--- User does not exist with phone number ${phone_number} ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, "User does not exist");
        }
        logger.info(`--- User exists with phone number ${phone_number} ---`);

        logger.info(`--- Checking if OTP is correct ---`);
        const isOTPCorrect = await verifyOTP(user, otp);
        if (!isOTPCorrect) {
            logger.info(`--- OTP is incorrect ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, "OTP is incorrect");
        }
        logger.info(`--- OTP is correct ---`);

        logger.info(`--- Generating JWT for user ${user.id} ---`);
        const token = await generateJWT(user.id);
        logger.info(`--- JWT generated for user ${user.id} ---`);

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

        return returnResponse(res, StatusCodes.OK, "User logged in successfully", { token, isSubscriptionActive,franchiseOne});

    } catch (error) {
        logger.error(`--- Error in providerOTPLogIn ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error, null);
    }
}

export { providerOTPLogIn };