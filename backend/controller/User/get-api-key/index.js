import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getUserById } from "./query.js";
import bcrypt from "bcrypt";

const getApiKeyEndpoint = async (req, res) => {
    try {
        logger.info(`GetApiKeyEndpoint`);
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

        if (!user.is_api_key_generated) {
            logger.error(`--- API key not generated for user ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `API key not generated. Please generate an API key first.`);
        }

        if (!user.is_api_key_active) {
            logger.error(`--- API key is not active ---`);
            return returnError(res, StatusCodes.FORBIDDEN, `API key is not active. Please generate a new API key.`);
        }

        logger.info(`--- Getting API key ---`);
        const apiKey = user.api_key;
        logger.info(`--- API key: ${apiKey} ---`);

        return returnResponse(res, StatusCodes.OK, `API key fetched successfully`, { api_key: apiKey });

    } catch (error) {
        logger.error(`--- Error in getApiKeyEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getApiKeyEndpoint: ${error}`);
    }
}

export { getApiKeyEndpoint };