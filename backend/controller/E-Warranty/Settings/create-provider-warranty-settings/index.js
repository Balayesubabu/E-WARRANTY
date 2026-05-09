import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, createProviderWarrantySettings } from "./query.js";
import { getProviderById } from "../get-provider-warranty-settings/query.js";

const createProviderWarrantySettingsEndpoint = async (req, res) => {
    try {
        logger.info(`createProviderWarrantySettingsEndpoint`);

        if (req.type && req.type !== 'provider' && req.type !== 'staff') {
            return returnError(res, StatusCodes.FORBIDDEN, `Only the owner or staff can manage warranty settings`);
        }

        let provider;
        if (req.provider_id) {
            logger.info(`--- Getting provider by provider_id (staff) : ${req.provider_id} ---`);
            provider = await getProviderById(req.provider_id);
        } else {
            const user_id = req.user_id;
            logger.info(`--- Getting provider details with user_id : ${user_id} ---`);
            provider = await getProviderByUserId(user_id);
        }
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with id : ${provider.id} ---`);

        const data = req.body;  

        const {
            registration_url,
            qr_data_to_url,
            qr_data,
            custom_field1,
            custom_field2
        } = data;

        logger.info(`--- Creating provider warranty settings with provider_id : ${provider.id} ---`);
        const provider_warranty_settings = await createProviderWarrantySettings(provider.id, data);
        if (!provider_warranty_settings) {
            logger.error(`--- Provider warranty settings not created with provider_id : ${provider.id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Provider warranty settings not created`);
        }
        logger.info(`--- Provider warranty settings created with provider_id : ${provider.id} ---`);

        return returnResponse(res, StatusCodes.OK, `Provider warranty settings created successfully`, provider_warranty_settings);
    } catch (error) {
        logger.error(`Error in createProviderWarrantySettingsEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in createProviderWarrantySettingsEndpoint`);
    }
};

export default createProviderWarrantySettingsEndpoint;