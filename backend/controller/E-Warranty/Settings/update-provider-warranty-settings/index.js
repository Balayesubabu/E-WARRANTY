import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getProviderWarrantySettings, updateProviderWarrantySettings, updatePreviousRegistrationUrls } from "./query.js";
import { getProviderById } from "../get-provider-warranty-settings/query.js";

const updateProviderWarrantySettingsEndpoint = async (req, res) => {
    try {
        logger.info(`updateProviderWarrantySettingsEndpoint`);

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

        logger.info(`--- Getting provider warranty settings with provider_id : ${provider.id} ---`);
        const provider_warranty_settings = await getProviderWarrantySettings(provider.id);
        if (!provider_warranty_settings) {
            logger.error(`--- Provider warranty settings not found with provider_id : ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider warranty settings not found`);
        }
        logger.info(`--- Provider warranty settings found with provider_id : ${provider.id} ---`);

        const data = req.body;

        const {
            registration_url,
            qr_data_to_url,
            qr_data,
            custom_field1,
            custom_field2,
            certificate_template,
        } = data;

        if (certificate_template !== undefined && certificate_template !== null) {
            logger.info(`--- Saving certificate_template: "${certificate_template}" (provider: ${provider.id}) ---`);
        } else {
            logger.warn(`--- certificate_template not in request body - existing value will be kept ---`);
        }
        logger.info(`--- Updating provider warranty settings with provider_id : ${provider.id} ---`);
        const updated_provider_warranty_settings = await updateProviderWarrantySettings(provider.id, data);
        if (!updated_provider_warranty_settings) {
            logger.error(`--- Provider warranty settings not updated with provider_id : ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider warranty settings not found or could not be updated`);
        }
        logger.info(`--- Provider warranty settings updated with provider_id : ${provider.id} ---`);

        if (provider_warranty_settings.registration_url !== updated_provider_warranty_settings.registration_url) {
            logger.info(`--- Updating previous registration urls ---`);
            await updatePreviousRegistrationUrls(provider_warranty_settings.id, provider_warranty_settings.registration_url);
            logger.info(`--- Previous registration urls updated with id : ${provider_warranty_settings.id} ---`);
        }

        return returnResponse(res, StatusCodes.OK, `Provider warranty settings updated successfully`, updated_provider_warranty_settings);
    } catch (error) {
        logger.error(`Error in updateProviderWarrantySettingsEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updateProviderWarrantySettingsEndpoint`);
    }
};

export default updateProviderWarrantySettingsEndpoint;