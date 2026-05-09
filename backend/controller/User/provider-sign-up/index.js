import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import { getUserByEmailOrPhoneNumber, updatingUserAndCreatingProvider, createFranchise } from "./query.js";
import {generateJWT} from "../../../services/generate-jwt-token.js";

const providerSignUp = async (req, res) => {
    try {
        logger.info(`providerSignUp`);
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
        }

        const provider = await updatingUserAndCreatingProvider(checkUser.id, data);
        if (!provider) {
            logger.error(`--- Failed to create provider ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Account already exists", null);
        }

        logger.info(`--- Provider and User Created Successfully ---`);

        logger.info(`--- Creating franchise for provider with provider id ${provider.id} ---`);

        const franchise = await createFranchise(provider, {
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
            logger.error(`--- Failed to create franchise for provider with provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create franchise for provider", null);
        }

        logger.info(`--- Franchise created successfully for provider with provider id ${provider.id} ---`);

        logger.info(`--- Generating JWT token for user with email ${email} or phone number ${phone_number} ---`);
        const token = await generateJWT(checkUser.id);
        if (!token) {
            logger.info(`--- JWT token generation failed ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "JWT token generation failed");
        }
        logger.info(`--- JWT token generated ---`);

        logger.info(`--- Provider Sign Up process completed successfully ---`);

        return returnResponse(res, StatusCodes.CREATED, "Provider and User Created Successfully", { provider, franchise, token });

    } catch (error) {
        logger.error('Error in providerSignUp:', error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error, null);
    }
}

export { providerSignUp };