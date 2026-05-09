import { getProviderByUserId, createService } from "./query.js";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const createServiceEndpoint = async (req, res) => {
    try {
        logger.info(`createServiceEndpoint`);
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

        logger.info(`--- Creating service ---`);
        const data = req.body;
        const {

            service_name,
            service_short_description,
            service_is_featured,
            service_type,
            service_description,
            service_is_active,
            service_slug,
            service_price,
            service_gst_percentage,
            service_gst_amount,
            service_total_price,
            service_sac_code,
            service_number,
            products_list,
            check_list,
            duration
        } = data;

        const service_icon = req.file;

        if (service_icon) {
            logger.info(`--- Uploading service icon ---`);
            const service_icon_url = await uploadFile(service_icon, `service_icon`);
            if (!service_icon_url) {
                logger.error(`--- Service icon not uploaded ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Service icon not uploaded`);
            }
            logger.info(`--- Service icon uploaded ---`);
        }

        logger.info(`--- Creating service with data ${JSON.stringify(data)} ---`);
        const service = await createService(data, provider.id,franchise_id,staff_id);
        if (!service) {
            logger.error(`--- Service not created with data ${JSON.stringify(data)} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Service not created with data ${JSON.stringify(data)}`);
        }
        logger.info(`--- Service created with data ${JSON.stringify(service)} ---`);

        return returnResponse(res, StatusCodes.CREATED, `Service created successfully`, service);

    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { createServiceEndpoint };