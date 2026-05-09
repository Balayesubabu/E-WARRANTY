import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import {
    getUserByEmailOrPhoneNumber,
    updatingUserAndCreatingOwner,
    createFranchise
} from "./query.js";
import { generateJWT } from "../../../services/generate-jwt-token.js";
import {
    giveWelcomeBonus,
    applyReferralCode,
    checkProfileCompletion,
    giveProfileCompletionBonus,
} from "../../../services/coinService.js";

const ownerSignUp = async (req, res) => {
    try {
        logger.info(`ownerSignUp`);
        logger.info(`Request body: ${JSON.stringify(req.body)}`);

        const {
            first_name,
            last_name,
            country_code,
            email,
            password,
            phone_number,
            address,
            company_name,
            company_address,
            franchise_name,
            franchise_address,
            franchise_city,
            franchise_state,
            franchise_country,
            franchise_pin_code,
            franchise_phone_number,
            franchise_email,
        } = req.body;

        // Validate required fields
        if (!password) {
            logger.error("Password is required");
            return returnError(res, StatusCodes.BAD_REQUEST, "Password is required", null);
        }

        if (!email || !phone_number) {
            logger.error("Email and phone number are required");
            return returnError(res, StatusCodes.BAD_REQUEST, "Email and phone number are required", null);
        }

        logger.info(`--- Checking if user already exists ---`);
        const checkUser = await getUserByEmailOrPhoneNumber(email, phone_number);

        if (!checkUser) {
            logger.info(`--- User not found with phone number ${phone_number} or email ${email} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "User not found. Please complete OTP verification first.", null);
        }

        if (checkUser.is_otp_verified === false) {
            logger.info(`--- User doesn't exists with  phone number ${phone_number} or email ${email} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "User is not verified", null);
        }

        logger.info(`--- Hashing password ---`);
        const hashedPassword = await bcrypt.hash(password, 10);

        logger.info(`--- Creating user ---`);

        const data = {
            first_name,
            last_name,
            country_code,
            email,
            hashed_password: hashedPassword,
            phone_number,
            address,
            company_name,
            company_address,
        };

        const owner = await updatingUserAndCreatingOwner(checkUser.id, data);
        if (!owner) {
            logger.error(`--- Failed to create owner ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Account already exists", null);
        }

        logger.info(`--- Owner and User Created Successfully ---`);

        logger.info(`--- Creating franchise for owner with owner id ${owner.id} ---`);

        const franchise = await createFranchise(owner, {
            franchise_name,
            franchise_address,
            franchise_city,
            franchise_state,
            franchise_country,
            franchise_pin_code,
            franchise_phone_number,
            franchise_email,
        });

        if (!franchise) {
            logger.error(`--- Failed to create franchise for owner with owner id ${owner.id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create franchise for owner", null);
        }

        logger.info(`--- Franchise created successfully for owner with owner id ${owner.id} ---`);

        logger.info(`--- Generating JWT token for user with email ${email} or phone number ${phone_number} ---`);
        const token = await generateJWT(checkUser.id);
        if (!token) {
            logger.info(`--- JWT token generation failed ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "JWT token generation failed");
        }
        logger.info(`--- JWT token generated ---`);

        // ═══════════════════════════════════════════════════════════════
        // COINS: Give welcome bonus to new owner
        // ═══════════════════════════════════════════════════════════════
        let welcomeBonusResult = null;
        let referralResult = null;
        let profileBonusResult = null;
        
        try {
            logger.info(`--- Giving welcome bonus to owner ${owner.id} ---`);
            welcomeBonusResult = await giveWelcomeBonus(owner.id);
            if (welcomeBonusResult.success) {
                logger.info(`--- Welcome bonus of ${welcomeBonusResult.bonus} coins given to owner ${owner.id} ---`);
            }
        } catch (coinError) {
            logger.error(`--- Failed to give welcome bonus: ${coinError.message} ---`);
        }

        // ═══════════════════════════════════════════════════════════════
        // COINS: Apply referral code if provided
        // ═══════════════════════════════════════════════════════════════
        const { referral_code } = req.body;
        if (referral_code) {
            try {
                logger.info(`--- Applying referral code ${referral_code} for owner ${owner.id} ---`);
                referralResult = await applyReferralCode(owner.id, referral_code);
                if (referralResult.success) {
                    logger.info(`--- Referral code applied successfully for owner ${owner.id} ---`);
                } else {
                    logger.info(`--- Referral code not applied: ${referralResult.message} ---`);
                }
            } catch (referralError) {
                logger.error(`--- Failed to apply referral code: ${referralError.message} ---`);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // COINS: Profile completion bonus (same rules as PUT /provider/update-provider)
        // ═══════════════════════════════════════════════════════════════
        try {
            const profileStatus = await checkProfileCompletion(owner.id);
            if (profileStatus.complete) {
                logger.info(`--- Profile complete for provider ${owner.id}, awarding completion bonus ---`);
                profileBonusResult = await giveProfileCompletionBonus(owner.id);
                if (profileBonusResult.success) {
                    logger.info(
                        `--- Profile completion bonus of ${profileBonusResult.bonus} coins given to provider ${owner.id} ---`
                    );
                } else {
                    logger.info(`--- Profile completion bonus not given: ${profileBonusResult.message} ---`);
                }
            } else {
                logger.info(
                    `--- Profile completion bonus skipped; missing: ${(profileStatus.missing || []).join(", ")} ---`
                );
            }
        } catch (profileBonusError) {
            logger.error(`--- Failed to check/give profile completion bonus: ${profileBonusError.message} ---`);
        }

        logger.info(`--- Owner Sign Up process completed successfully ---`);

        return returnResponse(res, StatusCodes.CREATED, "Owner and User Created Successfully", {
            owner,
            franchise,
            token,
            welcome_bonus: welcomeBonusResult,
            referral_applied: referralResult,
            profile_bonus: profileBonusResult,
        });
    } catch (error) {
        logger.error("Error in ownerSignUp:", error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error, null);
    }
};

export { ownerSignUp };
