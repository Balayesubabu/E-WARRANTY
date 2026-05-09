import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getUserById, updateUser } from "./query.js";
import {generateJWT} from "../../../services/generate-jwt-token.js";

const changePasswordEndpoint = async (req, res) => {
    try {
        logger.info(`changePasswordEndpoint`);
        const { old_password, new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return returnError(res, StatusCodes.BAD_REQUEST, `New password is required and must be at least 6 characters`);
        }

        const user_id = req.user_id;

        logger.info(`--- Checking if user exists with user_id: ${user_id} ---`);

        const user = await getUserById(user_id);
        if (!user) {
            logger.error(`--- User not found with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `User not found`);
        }

        logger.info(`--- User found with user_id: ${user_id} ---`);

        // Check if user has an existing password (manual registration)
        // Users from Google/OTP login may not have a password set
        if (user.password) {
            logger.info(`--- User has existing password, verifying old password ---`);
            
            if (!old_password) {
                return returnError(res, StatusCodes.BAD_REQUEST, `Old password is required`);
            }
            
            const is_password_correct = await bcrypt.compare(old_password, user.password);
            if (!is_password_correct) {
                logger.error(`--- Old password is incorrect ---`);
                return returnError(res, StatusCodes.BAD_REQUEST, `Old password is incorrect`);
            }
            logger.info(`--- Old password verified ---`);
        } else {
            logger.info(`--- User has no password (Google/OTP user), allowing password setup ---`);
        }

        logger.info(`--- Hashing new password ---`);

        const hashed_password = await bcrypt.hash(new_password, 10);

        logger.info(`--- Updating user with user_id: ${user_id} and new password ${hashed_password} ---`);

        const updated_user = await updateUser(user_id, { password: hashed_password });

        if (!updated_user) {
            logger.error(`--- Failed to update user with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update user`);
        }

        logger.info(`--- User updated with user_id: ${user_id} and new password ${hashed_password} ---`);

        logger.info(`--- Sending new token to user with user_id: ${user_id} ---`);

        const new_token = await generateJWT(user_id);

        return returnResponse(res, StatusCodes.OK, `Password updated successfully`, { token: new_token });

    } catch (error) {
        logger.error(`--- Error in changePasswordEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { changePasswordEndpoint };  