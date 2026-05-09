import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getUserById, updateUser } from "./query.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

const generateApiKeyEndpoint = async (req, res) => {
    try {
        logger.info(`GenerateApiKeyEndpoint`);

        // Only provider can generate API keys
        if (req.type && req.type !== 'provider') {
            return returnError(res, StatusCodes.FORBIDDEN, `Only the provider can manage API keys`);
        }

        const user_id = req.user_id;

        const password = req.body.password;

        if (!password) {
            logger.error(`--- Password is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Password is required`);
        }

        logger.info(`--- Getting user for user id: ${user_id} ---`);
        const user = await getUserById(user_id);
        if (!user) {
            logger.error(`--- User not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `User not found for user id: ${user_id}`);
        }
        logger.info(`--- User found for user id: ${user_id} ---`);

        logger.info(`--- Verifying password ---`);
        const verifyPassword = await bcrypt.compare(password, user.password);
        if (!verifyPassword) {
            logger.error(`--- Invalid password ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, `Invalid password`);
        }
        logger.info(`--- Password verified ---`);

        logger.info(`--- Generating API key ---`);
        const apiKey = "ak_" + crypto.randomBytes(32).toString("hex");
        logger.info(`--- API key generated with data: ${apiKey} ---`);

        logger.info(`--- Updating user with API key ---`);
        const updatedUser = await updateUser(user_id, {
            api_key: apiKey,
            is_api_key_generated: true,
            is_api_key_active: true,
        });
        if (!updatedUser) {
            logger.error(`--- Failed to update user with API key ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update user with API key`);
        }
        logger.info(`--- User updated with API key ---`);

        return returnResponse(res, StatusCodes.OK, `API key generated successfully`, { api_key: apiKey });
    } catch (error) {
        logger.error(`--- Error in generateApiKeyEndpoint: ${error} ---`);
        return returnError(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error in generateApiKeyEndpoint: ${error}`
        );
    }
};

export { generateApiKeyEndpoint };
