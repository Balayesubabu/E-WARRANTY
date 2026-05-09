import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getUserById, updateUser } from "./query.js";
import bcrypt from "bcrypt";

const updateApiKeyEndpoint = async (req, res) => {
    try {
        logger.info(`UpdateApiKeyEndpoint`);

        // Only provider can update API keys
        if (req.type && req.type !== 'provider') {
            return returnError(res, StatusCodes.FORBIDDEN, `Only the provider can manage API keys`);
        }

        const user_id = req.user_id;

        const data = req.body;

        const { password } = data;

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

        logger.info(`--- Verifying password ---`);
        const verifyPassword = await bcrypt.compare(password, user.password);
        if (!verifyPassword) {
            logger.error(`--- Invalid password ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, `Invalid password`);
        }
        logger.info(`--- Password verified ---`);

        logger.info(`--- Updating API key ---`);
        const updatedUser = await updateUser(user_id, data);
        if (!updatedUser) {
            logger.error(`--- Failed to update API key ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update API key`);
        }
        logger.info(`--- API key updated ---`);

        return returnResponse(res, StatusCodes.OK, `API key updated successfully`, {
            api_key: updatedUser.api_key,
        });
    } catch (error) {
        logger.error(`--- Error in updateApiKeyEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updateApiKeyEndpoint: ${error}`);
    }
};

export { updateApiKeyEndpoint };
