import { generateDealerJWT } from "../../../services/generate-jwt-token.js";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getDealerByEmailOrPhone, getFranchiseByProviderId } from "./query.js";
import bcrypt from "bcrypt";

const dealerLoginEndpoint = async (req, res) => {
    try {
        logger.info(`dealerLoginEndpoint`);
        const { email, phone, password } = req.body;

        logger.info(`--- Fetching dealer by email or phone ---`);
        const dealer = await getDealerByEmailOrPhone(email?.toLowerCase()?.trim(), phone);
        if (!dealer) {
            logger.error(`--- Dealer not found with email or phone ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
        }
        logger.info(`--- Dealer found ---`);

        // Check if dealer has a password set (account activated)
        if (!dealer.password) {
            logger.error(`--- Dealer account not activated ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, "Account not activated. Please set your password first.");
        }

        // Check if dealer is active
        if (dealer.status === 'INACTIVE') {
            logger.error(`--- Dealer account deactivated ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, "Your account has been deactivated. Please contact the provider.");
        }
        if (dealer.provider?.is_blocked) {
            logger.error(`--- Provider account is blocked (provider_id: ${dealer.provider_id}) ---`);
            return returnError(res, StatusCodes.FORBIDDEN, "Your organization's account has been blocked. Please contact support.");
        }

        logger.info(`--- Checking if password is correct ---`);
        let is_password_correct = false;

        // Check if stored password is a bcrypt hash (starts with $2a$ or $2b$)
        if (dealer.password.startsWith('$2a$') || dealer.password.startsWith('$2b$')) {
            is_password_correct = await bcrypt.compare(password, dealer.password);
        } else {
            // Legacy plain-text password comparison (for dealers created before hashing was added)
            is_password_correct = (password === dealer.password);
            if (is_password_correct) {
                // Migrate: hash the plain-text password for future logins
                const { ProviderDealer } = await import("../../../prisma/db-models.js");
                const hashed = await bcrypt.hash(password, 10);
                await ProviderDealer.update({
                    where: { id: dealer.id },
                    data: { password: hashed }
                });
                logger.info(`--- Migrated dealer ${dealer.id} password to bcrypt hash ---`);
            }
        }

        if (!is_password_correct) {
            logger.error(`--- Password is incorrect ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, "Password is incorrect");
        }
        logger.info(`--- Password is correct ---`);

        logger.info(`--- Fetching franchise by provider_id ---`);
        const franchise = await getFranchiseByProviderId(dealer.provider_id);
        logger.info(`--- Franchise fetched ---`);

        logger.info(`--- Creating token ---`);
        const token = await generateDealerJWT(dealer.id);
        logger.info(`--- Token created ---`);

        return returnResponse(res, StatusCodes.OK, "Dealer login successful", {
            token,
            franchise,
            dealer: {
                id: dealer.id,
                name: dealer.name,
                email: dealer.email,
                phone_number: dealer.phone_number,
                provider_id: dealer.provider_id,
                dealer_key: dealer.dealer_key
            }
        });
    } catch (error) {
        logger.error(`--- Error in dealer login ---`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error in dealer login", error);
    }
}

export { dealerLoginEndpoint };
