import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getUserById, updateUserPassword } from "./query.js";
import { generateJWT } from "../../../services/generate-jwt-token.js";

/**
 * POST /super-admin/change-password
 * Super Admin changes own password (requires old password)
 */
const changePasswordEndpoint = async (req, res) => {
    try {
        logger.info(`SuperAdmin changePasswordEndpoint`);
        const { old_password, new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return returnError(
                res,
                StatusCodes.BAD_REQUEST,
                "New password is required and must be at least 6 characters"
            );
        }

        const user_id = req.user_id;
        const user = await getUserById(user_id);

        if (!user) {
            return returnError(res, StatusCodes.NOT_FOUND, "User not found");
        }

        if (user.user_type !== "super_admin") {
            return returnError(res, StatusCodes.FORBIDDEN, "Super Admin access required");
        }

        if (!old_password) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Current password is required");
        }

        const isCorrect = await bcrypt.compare(old_password, user.password);
        if (!isCorrect) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Current password is incorrect");
        }

        const hashed_password = await bcrypt.hash(new_password, 10);
        await updateUserPassword(user_id, hashed_password);

        const new_token = await generateJWT(user_id);
        return returnResponse(res, StatusCodes.OK, "Password updated successfully", { token: new_token });
    } catch (error) {
        logger.error(`SuperAdmin changePasswordEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

export { changePasswordEndpoint };
