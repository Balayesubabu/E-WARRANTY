import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getServiceById, updateService } from "./query.js";

const updateServiceEndpoint = async (req, res) => {
    try {
        logger.info(`updateServiceEndpoint`);

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

        logger.info(`---- Getting provider by user id ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`---- Provider found ---`);

        const service_id = req.params.service_id;

        logger.info(`---- Getting service by id ---`);
        const service = await getServiceById(service_id);
        if (!service) {
            logger.error(`--- Service not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Service not found`);
        }
        logger.info(`---- Service found ---`);

        const data = req.body;

        const {
            service_name,
            service_description,
            service_price,
            service_gst_percentage,
            service_gst_amount,
            service_total_price,
            service_type,
            service_slug,
            service_sac_code,
            service_number
        } = data;

        const service_icon = req.file;

        if (service_icon) {
            logger.info(`--- Uploading service icon ---`);
            const service_icon_url = await uploadFile(service_icon, `service_icon`);
            if (!service_icon_url) {
                logger.error(`--- Service icon not uploaded ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Service icon not uploaded`);
            }
        }
        logger.info(`---- Service icon uploaded ---`);

        logger.info(`---- Updating service ---`);
        const updatedService = await updateService(service_id, data, provider.id, franchise_id, staff_id);
        if (!updatedService) {
            logger.error(`--- Service not updated ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Service not updated`);
        }
        logger.info(`---- Service updated ---`);

        return returnResponse(res, StatusCodes.OK, `Service updated successfully`, updatedService);

    } catch (error) {
        logger.error(`--- Error in updateServiceEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updateServiceEndpoint`);
    }
}

export { updateServiceEndpoint };