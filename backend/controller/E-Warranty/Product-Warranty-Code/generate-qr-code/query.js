import { Provider, ProviderProductWarrantyCode, ProviderWarrantySetting} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getWarrantyCodesByGroupId = async (group_id, provider_id) => {
    const warranty_codes = await ProviderProductWarrantyCode.findMany({
        where: {
            group_id: group_id,
            provider_id: provider_id
        }
    });
    return warranty_codes;
}

const getWarrantyCodesByBatchId = async (batch_id, provider_id) => {
    const warranty_codes = await ProviderProductWarrantyCode.findMany({
        where: {
            batch_id: batch_id,
            provider_id: provider_id
        }
    });
    return warranty_codes;
}

const getProviderWarrantySettings = async (provider_id) => {
    const provider_warranty_settings = await ProviderWarrantySetting.findFirst({
        where: { provider_id: provider_id },
        orderBy: { updated_at: 'desc' },
        select: { registration_url: true },
    });
    if (!provider_warranty_settings) {
        return null;
    }
    return provider_warranty_settings.registration_url;
};

export { getProviderByUserId, getWarrantyCodesByGroupId, getWarrantyCodesByBatchId, getProviderWarrantySettings};