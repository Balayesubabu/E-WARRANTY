import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import { getUserById, updateUserPassword } from "./query.js";

const forgotResetPasswordEndpoint = async (req, res) => {
    try {
        logger.info(`forgotResetPasswordEndpoint`);
        const { new_password } = req.body;

        const user_id = req.staff_id || req.user_id;

        logger.info(`--- Checking if user exists with user_id: ${user_id} ---`);
        const user = await getUserById(user_id);
        if (!user) {
            logger.error(`--- User not found with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "User not found");
        }
        logger.info(`--- User found with user_id: ${user_id} ---`);

        logger.info(`--- Hashing new password ---`);
        const hashed_password = await bcrypt.hash(new_password, 10);

        logger.info(`--- Updating user with new password ${hashed_password} ---`);
        const updated_user = await updateUserPassword(user_id, hashed_password);
        if (!updated_user) {
            logger.error(`--- User not updated with new password ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "User not updated with new password");
        }
        logger.info(`--- User updated with new password ---`);

        return returnResponse(res, StatusCodes.OK, "Password updated successfully");
    } catch (error) {
        logger.error(error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error forgot reset password");
    }
}

export { forgotResetPasswordEndpoint };