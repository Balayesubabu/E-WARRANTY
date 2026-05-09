import { logger, returnError,returnResponse } from "../../../../services/logger.js";
import { getAllSupportTicketFranchise, getProviderByUserId} from "./query.js";
import { StatusCodes } from "http-status-codes";
import { uploadSingleImage } from "../../../../services/upload.js";

const getAllSupportTicket = async (req, res) => {
    try {
        logger.info(`create SupportTicket`);

        logger.info(`--- Fetching user id from the request ---`);
        let user_id;
        let staff_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
            staff_id = req.staff_id; 
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
        }
        
        const franchise_id = req.franchise_id;
        
        
        logger.info(`--- User id: ${user_id} ---`);

        logger.info(`--- Fetching provider details with user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${user_id}`);
        }
        logger.info(`--- Found provider ${JSON.stringify(provider)} with user id ${user_id} ---`);

        logger.info(`--- get a supportTicket for franchise under provider ${provider.id} ---`);
        let provider_id = provider.id;
        const supportTicket = await getAllSupportTicketFranchise(franchise_id,provider_id);
        if (!supportTicket) {
            logger.error(`--- No franchises found for provider ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No franchises found for provider ${provider.id}`);
        }
        logger.info(`--- Found ${supportTicket.length} franchises for provider ${provider.id} with data ${JSON.stringify(supportTicket)} ---`);

        return returnResponse(res, StatusCodes.OK, `getAll supportTicket successfully`, supportTicket);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
    }
}

export { getAllSupportTicket };