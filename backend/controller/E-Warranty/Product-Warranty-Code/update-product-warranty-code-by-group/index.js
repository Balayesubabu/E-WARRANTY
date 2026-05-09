import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, updateProductWarrantyCodeByGroup } from "./query.js";

const updateProductWarrantyCodeByGroupEndpoint = async (req, res) => {
    try {
        logger.info(`updateProductWarrantyCodeByGroupEndpoint`);

        const user_id = req.user_id;

        const group_id = req.params.group_id;

        const data = req.body;

        const {
            warranty_from,
            warranty_to,
            warranty_days,
            warranty_check,
            warranty_check_interval,
            warranty_interval_dates,
            warranty_reminder_days,
            terms_and_conditions,
            terms_and_conditions_link
        } = data;

        logger.info(`--- Fetching provider with user id ${user_id} ---`);

        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.info(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with user id ${user_id} ---`);

        logger.info(`--- Updating product warranty code by group id ${group_id} ---`);

        const productWarrantyCode = await updateProductWarrantyCodeByGroup(group_id, provider.id, {
            warranty_from,
            warranty_to,
            warranty_days,
            warranty_check,
            warranty_check_interval,
            warranty_interval_dates,
            warranty_reminder_days,
            terms_and_conditions
        });
        if (!productWarrantyCode) {
            logger.info(`--- Product warranty code not found by group id ${group_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Product warranty code not found`);
        }

        logger.info(`--- Product warranty code updated by group id ${group_id} ---`);

        return returnResponse(res, StatusCodes.OK, `Product warranty code updated by group id ${group_id}`, productWarrantyCode);
    } catch (error) {
        logger.error(`updateProductWarrantyCodeByGroupEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update product warranty code`);
    }
}

export {
    updateProductWarrantyCodeByGroupEndpoint
}