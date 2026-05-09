import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getStaffById, getStaffRoleById, updateStaffRole } from "./query.js";

const updateStaffRoleEndpoint = async (req, res) => {
    try {
        logger.info(`UpdateStaffRoleEndpoint`);

        // Only owners can update staff roles
        if (req.type && req.type !== 'provider') {
            return returnError(res, StatusCodes.FORBIDDEN, `Only the owner can manage staff roles`);
        }

        const user_id = req.user_id;

        logger.info(`--- Fetching provider by user id ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with user id: ${user_id} ---`);

        const staff_id = req.params.staff_id;

        logger.info(`--- Fetching staff by id ---`);
        const staff = await getStaffById(provider.id, staff_id);
        if (!staff) {
            logger.error(`--- Staff not found with id: ${staff_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Staff not found`);
        }
        logger.info(`--- Staff found with id: ${staff_id} ---`);

        const { staff_role_id } = req.body;

        logger.info(`--- Fetching staff role by id ---`);
        const staff_role = await getStaffRoleById(staff_role_id);
        if (!staff_role) {
            logger.error(`--- Staff role not found with id: ${staff_role_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Staff role not found`);
        }
        logger.info(`--- Staff role found with id: ${staff_role_id} ---`);

        const updated_staff = await updateStaffRole(provider.id, staff_id, staff_role_id);
        if (!updated_staff) {
            logger.error(`--- Failed to update staff role ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update staff role`);
        }
        logger.info(`--- Staff role updated ---`);

        return returnResponse(res, StatusCodes.OK, `Staff role updated successfully`, updated_staff);
    } catch (error) {
        logger.error(`--- Error in UpdateStaffRoleEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update staff role`);
    }
}

export { updateStaffRoleEndpoint };