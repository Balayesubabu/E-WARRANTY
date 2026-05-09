import { getProviderByUserId, getRecievableAgeingReport } from './query.js';
import { logger, returnError, returnResponse } from '../../../../services/logger.js';
import { StatusCodes } from 'http-status-codes';

const getRecievableAgeingReportEndpoint = async (req, res) => {
    try {
        logger.info(`get user id`);
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
        logger.info(`user id is ${user_id}`);

        const { provider_customer_id} = req.query;

        logger.info(`--- Fetching provider id from the user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${user_id} ---`);

        logger.info(`--- Fetching Recievable Ageing Report from the provider id ${provider.id} ---`);
        const recievableAgeingReport = await getRecievableAgeingReport(provider.id, franchise_id, provider_customer_id);
        if (!recievableAgeingReport) {
            logger.error(`--- Recievable Ageing Report not found for provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Recievable Ageing Report not found for provider id ${provider.id}`);
        }
        logger.info(`--- Recievable Ageing Report found for provider id ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Recievable Ageing Report fetched successfully`, recievableAgeingReport);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getRecievableAgeingReportEndpoint };