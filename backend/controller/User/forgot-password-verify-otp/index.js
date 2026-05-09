import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {generateJWT} from "../../../services/generate-jwt-token.js";
import verifyOTP from "../../../services/verify-otp.js";
import { getUserByEmailOrPhoneNumber,getProviderByUserId,getFranchisesByProviderId,checkUserSubscription } from "./query.js";

const forgotPasswordVerifyOTPEndpoint = async (req, res) => {
    try {
        logger.info(`forgotPasswordVerifyOTPEndpoint`);
        const { email, phone_number, otp } = req.body;

        logger.info(`--- Checking if user exists with email ${email} or phone number ${phone_number} ---`);
        const user = await getUserByEmailOrPhoneNumber(email, phone_number);
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
        const token = await generateJWT(user.id);
        logger.info(`--- JWT generated for user ${user.id} ---`);

        // Try to get provider data (owners have providers, customers may not)
        logger.info(`--- Getting provider for user with user_id ${user.id} ---`);
        const provider = await getProviderByUserId(user.id);
        
        let franchiseOne = null;
        let isSubscriptionActive = false;

        if (provider) {
            logger.info(`--- Provider for user with user_id ${user.id} fetched ---`);

            logger.info(`--- Getting franchises for provider ${provider.id} ---`);
            franchiseOne = await getFranchisesByProviderId(provider.id);
            if (franchiseOne) {
                logger.info(`--- Franchises for provider ${provider.id} fetched ---`);
            } else {
                logger.info(`--- No franchises found for provider ${provider.id} ---`);
            }
            
            logger.info(`--- Checking user subscription status ---`);
            const subscription = await checkUserSubscription(provider.id);
            logger.info(`--- User subscription status checked ---`);

            if (subscription) {
                logger.info(`--- User has a subscription plans with id ${JSON.stringify(subscription)} ---`);

                if (subscription.is_base_plan_active &&
                    subscription.end_date > new Date() &&
                    subscription.is_cancelled === false &&
                    subscription.is_active === true
                ) {
                    logger.info(`--- Subscription is active ---`);
                    isSubscriptionActive = true;
                } else {
                    logger.info(`--- User does not have an active subscription ---`);
                }
            }
        } else {
            logger.info(`--- No provider found for user ${user.id} (customer account) ---`);
        }

        return returnResponse(res, StatusCodes.OK, "OTP is correct", { verified: true, token: token, isSubscriptionActive, franchiseOne });

    } catch (error) {
        logger.error(error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error forgot password");
    }
}

export { forgotPasswordVerifyOTPEndpoint };