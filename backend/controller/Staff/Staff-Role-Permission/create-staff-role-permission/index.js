import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getSubModuleById, createStaffRoleAndPermissions, getModuleById} from "./query.js";

const createStaffRolePermissionEndpoint = async (req, res) => {
    try {
        logger.info(`createStaffRolePermissionEndpoint`);

        // Only owners can create staff role permissions
        if (req.type && req.type !== 'provider') {
            return returnError(res, StatusCodes.FORBIDDEN, `Only the owner can manage staff roles`);
        }

        const user_id = req.user_id;

        logger.info(`--- Fetching provider by user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found ---`);

        const {
            name,
            description,
            sub_module_ids_permissions,
        } = req.body;

        let processed_sub_module_ids_permissions = [];
        for (const sub_module_id_permission of sub_module_ids_permissions) {
            let {
                sub_module_id,
                module_id,
                access_type
            } = sub_module_id_permission;

            console.log("sub module id ", sub_module_id);

            if (sub_module_id) {
                logger.info(`--- Fetching sub module by id : ${sub_module_id} ---`);
                const sub_module = await getSubModuleById(sub_module_id);
                if (!sub_module) {
                    logger.error(`--- Sub module not found ---`);
                    return returnError(res, StatusCodes.NOT_FOUND, `Sub module not found`);
                }
                logger.info(`--- Sub module found ---`);
                processed_sub_module_ids_permissions.push({
                    sub_module_id: sub_module.id,
                    module_id: sub_module.module_id,
                    access_type: access_type
                })
            }

            if (!sub_module_id && module_id) {
                logger.info(`--- Fetching module by id : ${module_id} ---`);
                const module = await getModuleById(module_id);
                if (!module) {
                    logger.error(`--- Module not found ---`);
                    return returnError(res, StatusCodes.NOT_FOUND, `Module not found`);
                }
                logger.info(`--- Module found ---`);
                processed_sub_module_ids_permissions.push({
                    module_id: module.id,
                    access_type: access_type
                })
            }
        }
        logger.info(`--- Creating staff role and permissions ---`); 

        // console.log(processed_sub_module_ids_permissions);

        const staff_role = await createStaffRoleAndPermissions(provider.id, name, description, processed_sub_module_ids_permissions);

        if (!staff_role) {
            logger.error(`--- Failed to create staff role ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create staff role`);
        }

        logger.info(`--- Staff role created ---`);
        return returnResponse(res, StatusCodes.OK, `Staff role created successfully`, staff_role);
    } catch (error) {
        logger.error(`--- Error in createStaffRolePermissionEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create staff role permission`);
    }
}



export { createStaffRolePermissionEndpoint };