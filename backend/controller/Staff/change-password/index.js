import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getUserById, updateUser } from "./query.js";
import {generateStaffJWT} from "../../../services/generate-jwt-token.js";

const changePasswordEndpoint = async (req, res) => {
    try {
        logger.info(`changePasswordEndpoint`);
        const { old_password, new_password } = req.body;

        // verifyToken sets req.staff_id for staff users and req.user_id for the provider's user_id
        // We need the staff_id to look up the Staff record
        const staff_id = req.staff_id;

        if (!staff_id) {
            logger.error(`--- staff_id not found in request. This endpoint requires staff authentication. ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Staff authentication required`);
        }

        logger.info(`--- Checking if staff exists with staff_id: ${staff_id} ---`);

        const user = await getUserById(staff_id);
        if (!user) {
            logger.error(`--- Staff not found with staff_id: ${staff_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Staff not found`);
        }

        logger.info(`--- Staff found with staff_id: ${staff_id} ---`);

        logger.info(`--- Checking if old password is correct ---`);

        const is_password_correct = await bcrypt.compare(old_password, user.password);
        if (!is_password_correct) {
            logger.error(`--- Old password is incorrect ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Old password is incorrect`);
        }

        logger.info(`--- Old password is correct ---`);

        logger.info(`--- Hashing new password ---`);

        const hashed_password = await bcrypt.hash(new_password, 10);

        logger.info(`--- Updating staff with staff_id: ${staff_id} ---`);

        const updated_user = await updateUser(staff_id, { password: hashed_password });

        if (!updated_user) {
            logger.error(`--- Failed to update staff with staff_id: ${staff_id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update staff password`);
        }

        logger.info(`--- Staff password updated for staff_id: ${staff_id} ---`);

        logger.info(`--- Generating new token for staff_id: ${staff_id} ---`);

        const new_token = await generateStaffJWT(staff_id);

        return returnResponse(res, StatusCodes.OK, `Password updated successfully`, { token: new_token });

    } catch (error) {
        logger.error(`--- Error in changePasswordEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { changePasswordEndpoint };  