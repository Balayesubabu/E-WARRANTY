import { Provider, ProviderWarrantySetting } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getProviderWarrantySettings = async (provider_id) => {
    const row = await ProviderWarrantySetting.findFirst({
        where: { provider_id: provider_id },
        orderBy: { updated_at: 'desc' },
        select: { id: true, registration_url: true, qr_data_to_url: true, qr_data: true, custom_field1: true, custom_field2: true, certificate_template: true },
    });
    return row ? { ...row, certificate_template: row.certificate_template || "classic" } : null;
};

const updateProviderWarrantySettings = async (provider_id, data) => {
    const existingSettings = await ProviderWarrantySetting.findFirst({
        where: { provider_id: provider_id },
        orderBy: { updated_at: 'desc' },
        select: { id: true },
    });
    if (!existingSettings) return null;

    const updateData = {
        registration_url: data.registration_url,
        qr_data_to_url: data.qr_data_to_url,
        qr_data: data.qr_data,
        custom_field1: data.custom_field1,
        custom_field2: data.custom_field2,
    };
    if (data.certificate_template !== undefined && data.certificate_template !== null) {
        const t = String(data.certificate_template).trim();
        updateData.certificate_template = t || "classic";
    }
    if (data.default_category !== undefined) {
        updateData.default_category = data.default_category;
    }
    // Update ALL rows for this provider so certificate_template is consistent (avoids multiple rows returning different values)
    await ProviderWarrantySetting.updateMany({
        where: { provider_id },
        data: updateData,
    });
    return ProviderWarrantySetting.findFirst({
        where: { provider_id },
        orderBy: { updated_at: 'desc' },
    });
};

const updatePreviousRegistrationUrls = async (provider_warranty_settings_id, registration_url) => {
    return ProviderWarrantySetting.update({
        where: { id: provider_warranty_settings_id },
        data: { previous_registration_urls: { push: registration_url } },
    });
};

export { getProviderByUserId, getProviderWarrantySettings, updateProviderWarrantySettings, updatePreviousRegistrationUrls };