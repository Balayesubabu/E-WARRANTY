import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { ServiceCenter } from "../../../prisma/db-models.js";
import { generateServiceCenterJWT } from "../../../services/generate-jwt-token.js";

/**
 * PUT /service-center/change-password
 * Change password for logged-in service center
 */
const changePasswordEndpoint = async (req, res) => {
    try {
        const service_center_id = req.service_center_id;
        if (!service_center_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Service center authentication required");
        }

        const { old_password, new_password } = req.body;

        if (!old_password || !new_password) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Old password and new password are required");
        }

        if (new_password.length < 6) {
            return returnError(res, StatusCodes.BAD_REQUEST, "New password must be at least 6 characters");
        }

        const sc = await ServiceCenter.findUnique({
            where: { id: service_center_id, is_deleted: false },
            select: { id: true, password: true },
        });

        if (!sc) {
            return returnError(res, StatusCodes.NOT_FOUND, "Service center not found");
        }

        if (!sc.password) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Password not set for this account. Please use password reset.");
        }

        const isCorrect = await bcrypt.compare(old_password, sc.password);
        if (!isCorrect) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Current password is incorrect");
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await ServiceCenter.update({
            where: { id: service_center_id },
            data: { password: hashedPassword },
        });

        const newToken = await generateServiceCenterJWT(service_center_id);

        return returnResponse(res, StatusCodes.OK, "Password updated successfully", { token: newToken });
    } catch (error) {
        logger.error(`serviceCenterChangePasswordEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to change password");
    }
};

export { changePasswordEndpoint };
