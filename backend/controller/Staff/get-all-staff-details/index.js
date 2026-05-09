import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getStaffById } from "./query.js";
import { prisma } from "../../../prisma/db-models.js";

const getAllStaffDetailsEndpoint = async (req, res) => {
    try {
        logger.info(`GetStaffDetailsEndpoint`);

        let user_id;
        if(req.type == 'staff'){
            user_id = req.user_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
        }
        
        const franchise_id = req.franchise_id;

        logger.info(`--- Fetching provider by user id ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with user id: ${user_id} ---`);

        logger.info(`--- Fetching staff by id ---`);
        const staff = await getStaffById(provider.id,franchise_id);
        if (!staff) {
            logger.error(`--- Staff not found with id: ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Staff not found`);
        }
        logger.info(`--- Staff found with id: ${provider.id} ---`);

        for (let i = 0; i < staff.length; i++) {
            if(staff[i].department_id){
                const department = await prisma.department.findFirst({
                    where: {
                        id: staff[i].department_id
                    }
                });
                staff[i].department_name = department?.department_name || null;
            }
        }

        return returnResponse(res, StatusCodes.OK, `Get all Staff details fetched successfully`, staff);
    } catch (error) {
        logger.error(`--- Error in GetStaffDetailsEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get all staff details`);
    }
}

export { getAllStaffDetailsEndpoint };