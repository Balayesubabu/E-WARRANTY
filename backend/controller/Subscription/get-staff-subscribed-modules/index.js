import { logger,returnError,returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getStaffByUserId, getProviderById, getStaffRolePermissions,getModuleById,getSubModuleById} from "./query.js";

const getStaffSubscribedModules = async (req, res) => {
    try {
        logger.info(`GetStaffSubscribedModules`);
        let user_id;
        let staff_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
           staff_id = req.staff_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
            staff_id = null;
        }
        const staff = await getStaffByUserId(staff_id);
        if (!staff) {
            logger.error(`--- Staff not found for user id: ${staff_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Staff not found for user id: ${staff_id}`);
        }
        logger.info(`--- Staff found for user id: ${staff_id} ---`);

        const provider = await getProviderById(staff.provider_id);
        if (!provider) {
            logger.error(`--- Provider not found for staff id: ${staff.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for staff id: ${staff.id}`);
        }
        logger.info(`--- Provider found for staff id: ${staff.id} ---`);

        const staffRolePermissions = await getStaffRolePermissions(staff.id);
        if (!staffRolePermissions) {
            logger.error(`--- Staff not subscribed to any module ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Staff not subscribed to any module`);
        }
        // logger.info(`--- Staff subscribed to modules: ${JSON.stringify(staffRolePermissions)} ---`);
        let modules = [];
        for (const perm of staffRolePermissions) {
        let data;
        let subData;
        if(perm.module_id){
            if(!perm.sub_module_id){
                const moduleData = await getModuleById(perm.module_id);
                perm.module = moduleData;
                data = {
                    id: perm.module.id,
                    name: perm.module.name,
                    description: perm.module.description,
                    access_type: perm.access_type,
                    SubModule: []
                }
                modules.push(data);
            }
            else{   
                    const subModuleData = await getSubModuleById(perm.sub_module_id);
                    perm.sub_module = subModuleData;
                    subData = {
                        id: perm.sub_module.id,
                        name: perm.sub_module.name,
                        description: perm.sub_module.description,
                        access_type: perm.access_type
                    }
                    modules.forEach(mod => {
                        if(mod.SubModule === undefined){
                            mod.SubModule = [];
                        }
                        else{
                            if(mod.id === perm.module_id){
                            mod.SubModule.push(subData);
                        }
                        }
                        
                    });
            }
        }
    }

        // console.log(`modules: ${JSON.stringify(modules)}`);
        return returnResponse(res, StatusCodes.OK, `Staff subscribed to modules:`, modules);
    } catch (error) {
        logger.error(`Error in getStaffSubscribedModules: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getStaffSubscribedModules: ${error}`);
    }
}

export { getStaffSubscribedModules };