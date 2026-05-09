import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderById, getProviderByUserIdField, getProviderWarrantySettings } from "./query.js";
import { resolveRegistrationUrl } from "../../../../utils/resolveRegistrationUrl.js";

const defaultWarrantySettingsPayload = (provider, registration_url) => ({
    id: null,
    provider_id: provider.id,
    registration_url,
    qr_data_to_url: false,
    qr_data: true,
    custom_field1: "",
    custom_field2: "",
    certificate_template: "classic",
    default_category: "",
    provider: { id: provider.id, company_name: provider.company_name || "" },
});

const getProviderWarrantySettingsEndpoint = async (req, res) => {
    try {
        logger.info(`getProviderWarrantySettingsEndpoint`);

        // Use URL param (public), or provider_id (staff), or user_id (owner)
        const provider_id_param = req.params.provider_id;
        const provider_id_from_req = req.provider_id;
        const user_id = req.user_id;

        let provider;
        if (provider_id_param) {
            logger.info(`--- Getting provider by provider id : ${provider_id_param} ---`);
            provider = await getProviderById(provider_id_param);
        } else if (provider_id_from_req) {
            logger.info(`--- Getting provider by req.provider_id (staff) : ${provider_id_from_req} ---`);
            provider = await getProviderById(provider_id_from_req);
        } else if (user_id) {
            logger.info(`--- Getting provider by user_id : ${user_id} ---`);
            provider = await getProviderByUserIdField(user_id);
        }

        if (!provider) {
            logger.error(`--- Provider not found (provider_id_param: ${provider_id_param}, user_id: ${user_id}) ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with id : ${provider.id} ---`);

        logger.info(`--- Getting provider warranty settings with provider_id : ${provider.id} ---`);
        const provider_warranty_settings = await getProviderWarrantySettings(provider.id);
        if (!provider_warranty_settings) {
            const registration_url = resolveRegistrationUrl("");
            if (registration_url) {
                logger.info(`--- No saved warranty settings; returning defaults from FRONTEND_URL ---`);
                return returnResponse(
                    res,
                    StatusCodes.OK,
                    `Provider warranty settings not found; defaults applied`,
                    defaultWarrantySettingsPayload(provider, registration_url)
                );
            }
            logger.info(`--- Provider warranty settings not found and FRONTEND_URL unset ---`);
            return returnResponse(res, StatusCodes.OK, `Provider warranty settings not found`, null);
        }
        logger.info(`--- Provider warranty settings found with provider_id : ${provider.id} ---`);

        const merged = {
            ...provider_warranty_settings,
            registration_url: resolveRegistrationUrl(provider_warranty_settings.registration_url || ""),
        };
        return returnResponse(res, StatusCodes.OK, `Provider warranty settings fetched successfully`, merged);
    } catch (error) {
        logger.error(`Error in getProviderWarrantySettingsEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getProviderWarrantySettingsEndpoint`);
    }
};

export default getProviderWarrantySettingsEndpoint;