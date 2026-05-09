import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getCreditNoteByDateQuery } from "./query.js";

const getCreditNoteByDateEndpoint = async (req, res) => {
    try {
        logger.info(`getCreditNoteByDateEndpoint`);

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
        const franchise_id = req.franchise_id

        logger.info(`--- Getting provider details with user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id : ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with id : ${provider.id} ---`);

        const { start_date, end_date } = req.query;

        logger.info(`--- Getting credit notes with start_date : ${start_date} and end_date : ${end_date} ---`);
        const credit_notes = await getCreditNoteByDateQuery(start_date, end_date, provider.id);

        if (credit_notes.length === 0) {
            logger.info(`--- No credit notes found with start_date : ${start_date} and end_date : ${end_date} ---`);
            return returnResponse(res, StatusCodes.OK, `No credit notes found`, []);
        }

        logger.info(`--- Credit notes found with start_date : ${start_date} and end_date : ${end_date} ---`);
        return returnResponse(res, StatusCodes.OK, `Credit notes fetched successfully`, credit_notes);
    } catch (error) {
        logger.error(`Error in getCreditNoteByDateEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getCreditNoteByDateEndpoint`);
    }
};

export default getCreditNoteByDateEndpoint;