import { logger, returnError,returnResponse } from "../../../../services/logger.js";
import { createSupportTicketHistoryFranchise, getProviderByUserId,getSupportTicketFranchise} from "./query.js";
import { StatusCodes } from "http-status-codes";

const createSupportTicketHistory = async (req, res) => {
    try {
        logger.info(`create SupportTicketHistory`);
        logger.info(`--- Fetching user id from the request ---`);
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
        const {supportTicket_id,message} = req.body;
        if (!franchise_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Franchise id is required");
        }
        if (!supportTicket_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Support ticket id is required");
        }
        logger.info(`--- User id: ${user_id} ---`);
        logger.info(`--- Fetching provider details with user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);    
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${user_id}`);
        }
        logger.info(`--- Found provider ${JSON.stringify(provider)} with user id ${user_id} ---`);

        let provider_id = provider.id;

         const supportTicket = await getSupportTicketFranchise(supportTicket_id,franchise_id,provider_id);
        if (!supportTicket) {
            logger.error(`--- Support ticket not found with id ${supportTicket_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Support ticket not found with id ${supportTicket_id}`);
        }
        logger.info(`--- Found ${supportTicket.length} franchises for provider ${provider.id} with data ${JSON.stringify(supportTicket)} ---`);


        logger.info(`--- creating a supportTicketHistory for franchise under provider ${provider.id} ---`);
        const supportTicketHistory = await createSupportTicketHistoryFranchise(supportTicket_id,message,provider_id,franchise_id,staff_id);
        if (!supportTicketHistory) {
            logger.error(`--- No franchises found for provider ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No franchises found for provider ${provider.id}`);
        }
        logger.info(`--- Found ${supportTicketHistory.length} franchises for provider ${provider.id} with data ${JSON.stringify(supportTicketHistory)} ---`);   
        return returnResponse(res, StatusCodes.OK, `created supportTicketHistory successfully`, supportTicketHistory);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
    }   
}

export { createSupportTicketHistory };