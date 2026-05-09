import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getDeliveryChallanByDateQuery } from "./query.js";

const getDeliveryChallanByDateEndpoint = async (req, res) => {
    try {
        logger.info(`getDeliveryChallanByDateEndpoint`);

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

        logger.info(`--- Getting delivery challans with start_date : ${start_date} and end_date : ${end_date} ---`);
        const delivery_challans = await getDeliveryChallanByDateQuery(start_date, end_date, provider.id);

        if (delivery_challans.length === 0) {
            logger.info(`--- No delivery challans found with start_date : ${start_date} and end_date : ${end_date} and provider_id : ${provider.id} ---`);
            return returnResponse(res, StatusCodes.OK, `No delivery challans found`, []);
        }

        logger.info(`--- Delivery challans found with start_date : ${start_date} and end_date : ${end_date} and provider_id : ${provider.id} ---`);
        return returnResponse(res, StatusCodes.OK, `Delivery challans fetched successfully`, delivery_challans);
    } catch (error) {
        logger.error(`Error in getDeliveryChallanByDateEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getDeliveryChallanByDateEndpoint`);
    }
};

export default getDeliveryChallanByDateEndpoint;