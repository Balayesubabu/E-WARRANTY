import { logger, returnError,returnResponse } from "../../../../services/logger.js";
import { createDepartmentFranchise, getProviderByUserId} from "./query.js";
import { StatusCodes } from "http-status-codes";

const createDepartment = async (req, res) => {
    try {
        logger.info(`createDepartment`);

        logger.info(`--- Fetching user id from the request ---`);
        let user_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
        }
        
        const franchise_id = req.franchise_id;
        const department_name = req.body.department_name;
        console.log(franchise_id, department_name); 
        if (!franchise_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Franchise id is required");
        }
        logger.info(`--- User id: ${user_id} ---`);

        logger.info(`--- Fetching provider details with user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${user_id}`);
        }
        logger.info(`--- Found provider ${JSON.stringify(provider)} with user id ${user_id} ---`);

        logger.info(`--- creating a department for franchise under provider ${provider.id} ---`);
        const department = await createDepartmentFranchise(department_name,franchise_id,provider.id);
        if (!department) {
            logger.error(`--- No franchises found for provider ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No franchises found for provider ${provider.id}`);
        }
        logger.info(`--- Found ${department.length} franchises for provider ${provider.id} with data ${JSON.stringify(department)} ---`);

        return returnResponse(res, StatusCodes.OK, `created department successfully`, department);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
    }
}

export { createDepartment };