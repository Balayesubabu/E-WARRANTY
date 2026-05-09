import {
  logger,
  returnError,
  returnResponse,
} from "../../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, createCustomerRequirement } from "./query.js";

const createRequirementEndpoint = async (req, res) => {
    try {
        logger.info(`createRequirementEndpoint`);
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
        const franchise_id = req.franchise_id;
        logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${req.user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${req.user_id} ---`);
        logger.info(`--- Creating customer requirement ---`);
        const data = req.body;
        const {
            requirement_name
        } = data;
        const newRequirement = await createCustomerRequirement(requirement_name,provider.id,franchise_id,staff_id); 
        if (!newRequirement) {
            logger.error(`--- Customer requirement not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Customer requirement not created`);
        }
        logger.info(`--- Customer requirement created ---`);
        return returnResponse(res, StatusCodes.CREATED, newRequirement);
    } catch (error) {
        logger.error(`Error in createRequirementEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};
export { createRequirementEndpoint };