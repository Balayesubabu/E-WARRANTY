import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getUserById, getUserByEmail, updateUserEmail } from "./query.js";
import {
    normalizeEmailForIdentity,
    findGlobalEmailLoginConflict,
    GLOBAL_EMAIL_IN_USE_MESSAGE,
} from "../../../utils/globalEmailIdentity.js";

const updateEmailEndpoint = async (req, res) => {
    try {
        logger.info("updateEmailEndpoint");

        const user_id = req.user_id;
        if (!user_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "User id not found in token");
        }

        const { oldEmail, newEmail, password } = req.body;

        // Validate required fields (password optional for OTP users)
        if (!oldEmail || !newEmail) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Old email and new email are required");
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Invalid email format");
        }

        logger.info(`--- Checking if user exists with user_id: ${user_id} ---`);

        const user = await getUserById(user_id);
        if (!user) {
            logger.error(`--- User not found with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "User not found");
        }

        logger.info(`--- User found with user_id: ${user_id} ---`);

        // Verify old email matches current email
        if (user.email?.toLowerCase() !== oldEmail.toLowerCase()) {
            logger.error(`--- Old email does not match current email ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "Old email does not match your current email");
        }

        // Verify password (only if user has one - OTP users may not have a password)
        if (user.password) {
            logger.info(`--- User has password, verifying ---`);
            
            if (!password) {
                return returnError(res, StatusCodes.BAD_REQUEST, "Password is required to update email");
            }
            
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                logger.error(`--- Invalid password ---`);
                return returnError(res, StatusCodes.UNAUTHORIZED, "Invalid password");
            }
            logger.info(`--- Password verified successfully ---`);
        } else {
            logger.info(`--- User has no password (OTP user), skipping password verification ---`);
        }

        // Check if new email is same as old email
        if (oldEmail.toLowerCase() === newEmail.toLowerCase()) {
            return returnError(res, StatusCodes.BAD_REQUEST, "New email must be different from old email");
        }

        // Check if new email is already in use (any login surface)
        logger.info(`--- Checking if new email is already in use ---`);
        const newNorm = normalizeEmailForIdentity(newEmail);
        if (!newNorm) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Invalid email format");
        }
        const existingUser = await getUserByEmail(newNorm);
        if (existingUser && existingUser.id !== user_id) {
            logger.error(`--- Email ${newNorm} is already in use ---`);
            return returnError(res, StatusCodes.CONFLICT, "Email is already in use");
        }
        const globalConflict = await findGlobalEmailLoginConflict(newNorm, { excludeUserId: user_id });
        if (globalConflict) {
            return returnError(res, StatusCodes.CONFLICT, GLOBAL_EMAIL_IN_USE_MESSAGE, {
                code: "GLOBAL_EMAIL_IN_USE",
                existingRole: globalConflict,
            });
        }

        logger.info(`--- Updating email to ${newNorm} ---`);

        const updatedUser = await updateUserEmail(user_id, newNorm);
        if (!updatedUser) {
            logger.error(`--- Failed to update email ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update email");
        }

        logger.info(`--- Email updated successfully ---`);

        return returnResponse(res, StatusCodes.OK, "Email updated successfully", {
            user: {
                email: updatedUser.email
            }
        });

    } catch (error) {
        logger.error(`--- Error in updateEmailEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

export { updateEmailEndpoint };
