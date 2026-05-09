import {logger,returnError,returnResponse} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, updateFranchise } from "./query.js";

const updateProviderFranchise = async (req, res) => {
    try {
        logger.info(`updateProviderFranchise`);
        const user_id = req.user_id;
        const franchise_id = req.body.franchise_id;
        logger.info(`--- User id: ${user_id} ---`);
        const data = {
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            pin_code: req.body.pin_code,
            phone_number: req.body.phone_number,
            email: req.body.email,
            is_active: req.body.is_active,
            is_deleted: req.body.is_deleted,
            deleted_at: req.body.deleted_at? new Date(req.body.deleted_at) : null
        }

        logger.info(`--- Fetching provider details ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${user_id}`);
        }
        logger.info(`--- Found provider ${JSON.stringify(provider)} with user id ${user_id} ---`);

        logger.info(`--- Updating franchise for provider ---`);
        const updatedFranchise = await updateFranchise(franchise_id, provider.id,  data);
        if (!updatedFranchise) {
            logger.error(`--- Failed to update franchise for provider ${provider.id} and data ${JSON.stringify(data)} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update franchise for provider ${provider.id}`);
        }
        logger.info(`--- Franchise updated successfully for provider ${provider.id} and data ${JSON.stringify(data)} ---`);

        return returnResponse(res, StatusCodes.OK, `Franchise updated successfully`, updatedFranchise);
    } catch (error) {
        logger.error('Error in updateProviderFranchise:', error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
    }
}

export { updateProviderFranchise };
