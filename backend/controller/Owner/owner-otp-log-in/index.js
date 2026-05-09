import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { generateJWT } from "../../../services/generate-jwt-token.js";
import verifyOTP from "../../../services/verify-otp.js";
import {
    getUserByEmailOrPhoneNumber,
    checkUserSubscription,
    getFranchisesByOwnerId,
    getOwnerByUserId
} from "./query.js";

const ownerOTPLogIn = async (req, res) => {
    try {
        logger.info("ownerOTPLogIn");
        const { email, phone_number, otp } = req.body;

        logger.info(`--- Checking if email/phone and OTP are provided ---`);
        if ((!email && !phone_number) || !otp) {
            logger.info(`--- Email or phone number or OTP is not provided ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, "Email or phone number and OTP are required");
        }
        logger.info(`--- Email/phone and OTP are provided ---`);

        logger.info(`--- Checking if user exists with email ${email} or phone number ${phone_number} ---`);
        const user = await getUserByEmailOrPhoneNumber(email, phone_number);

        if (!user) {
            logger.info(`--- User does not exist with email ${email} or phone number ${phone_number} ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, "User does not exist");
        }
        logger.info(`--- User exists with email ${email} or phone number ${phone_number} ---`);

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

        logger.info(`--- Getting owner for user with user_id ${user.id} ---`);
        const owner = await getOwnerByUserId(user.id);
        if (!owner) {
            logger.error(`--- No owner found for user with user_id ${user.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "No owner found");
        }
        if (owner.is_blocked) {
            logger.error(`--- Provider/owner account is blocked (provider_id: ${owner.id}) ---`);
            return returnError(res, StatusCodes.FORBIDDEN, "Your account has been blocked. Please contact support.");
        }
        if (owner.is_deleted) {
            logger.error(`--- Provider/owner account is deleted (provider_id: ${owner.id}) ---`);
            return returnError(res, StatusCodes.FORBIDDEN, "Account not found.");
        }
        logger.info(`--- Owner for user with user_id ${user.id} fetched ---`);

        logger.info(`--- Getting franchises for owner ${owner.id} ---`);
        const franchiseOne = await getFranchisesByOwnerId(owner.id);
        if (!franchiseOne) {
            logger.error(`--- No franchises found for owner ${owner.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "No franchises found");
        }
        logger.info(`--- Franchises for owner ${owner.id} fetched ---`);

        logger.info(`--- Checking user subscription status ---`);
        const subscription = await checkUserSubscription(owner.id);
        logger.info(`--- User subscription status checked ---`);

        let isSubscriptionActive = false;
        if (subscription) {
            logger.info(`--- User has a subscription plans with id ${JSON.stringify(subscription)} ---`);

            logger.info(`--- Checking if subscription is active `);

            if (
                subscription.is_base_plan_active &&
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

        return returnResponse(res, StatusCodes.OK, "User logged in successfully", {
            token,
            isSubscriptionActive,
            franchiseOne
        });
    } catch (error) {
        logger.error(`--- Error in ownerOTPLogIn ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error, null);
    }
};

export { ownerOTPLogIn };
