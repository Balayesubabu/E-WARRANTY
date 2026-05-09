import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import { generateJWT } from "../../../services/generate-jwt-token.js";
import {
    getUserByEmailOrPhoneNumber,
    checkUserSubscription,
    getFranchisesByOwnerId,
    getOwnerByUserId
} from "./query.js";

const ownerLogIn = async (req, res) => {
    try {
        logger.info("ownerLogIn");
        const { email, phone_number, password } = req.body;

        logger.info(`--- Checking provided email or phone number ---`);
        if (!email && !phone_number) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Email or phone number is required");
        }
        logger.info(`--- Email or phone number provided ---`);

        logger.info(`--- Checking provided password ---`);
        if (!password) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Password is required");
        }
        logger.info(`--- Password provided ---`);

        logger.info(`--- Checking if user exists ---`);
        const user = await getUserByEmailOrPhoneNumber(email, phone_number);
        if (!user) {
            logger.info(`--- User with email ${email} or phone number ${phone_number} not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "User not found");
        }
        logger.info(`--- User found with email ${email} or phone number ${phone_number} ---`);

        if (!user.password) {
            logger.error(`--- User has no password set (user_id: ${user.id}) ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "Password not set for this account. Please use Forgot password.");
        }

        logger.info(`--- Checking if password is correct ---`);
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            logger.info(
                `--- Password is incorrect by user with email ${email} or phone number ${phone_number} and user_id ${user.id} ---`
            );
            return returnError(res, StatusCodes.UNAUTHORIZED, "Invalid password");
        }
        logger.info(
            `--- Password is correct for user with email ${email} or phone number ${phone_number} and user_id ${user.id} ---`
        );

        logger.info(`--- Creating token for user with user_id ${user.id} ---`);
        const token = await generateJWT(user.id);
        logger.info(`--- Token created for user with user_id ${user.id} ---`);

        console.log(user, " user details");

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

        return returnResponse(res, StatusCodes.OK, "User found and password is correct", {
            token,
            isSubscriptionActive,
            franchiseOne
        });
    } catch (error) {
        console.log(error);
        logger.error(`--- Error in ownerLogIn ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error, null);
    }
};

export { ownerLogIn };
