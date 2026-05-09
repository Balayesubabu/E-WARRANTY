import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getStaffRolePermissions,getStaffByStaffId} from "./query.js";

const getStaffRolePermissionEndpoint = async (req, res) => {
    try {
        logger.info(`getStaffRolePermissionEndpoint`);

        const user_id = req.user_id;
        const staff_id = req.params.staff_id;

        logger.info(`--- Fetching provider by user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found ---`);

        logger.info(`--- Fetching staff by staff id : ${staff_id} ---`);
        const staff = await getStaffByStaffId(staff_id);
        if (!staff) {
            logger.error(`--- staff not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `staff not found`);
        }
        logger.info(`--- staff found ---`);


        const staff_role_permissions = await getStaffRolePermissions(provider.id,staff.staff_role_id);
        if (!staff_role_permissions) {
            logger.error(`--- Staff role permissions not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Staff role permissions not found`);
        }
        logger.info(`--- Staff role permissions found ---`);

        return returnResponse(res, StatusCodes.OK, `Staff role permissions fetched successfully`, staff_role_permissions);
    } catch (error) {
        logger.error(`--- Error in getStaffRolePermissionEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get staff role permission`);
    }
}

export { getStaffRolePermissionEndpoint };