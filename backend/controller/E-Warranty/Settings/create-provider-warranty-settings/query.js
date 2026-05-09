import { Provider, ProviderWarrantySetting } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const createProviderWarrantySettings = async (provider_id, data) => {
    const row = await ProviderWarrantySetting.create({
        data: {
            provider_id,
            registration_url: data.registration_url ?? "",
            qr_data_to_url: data.qr_data_to_url ?? false,
            qr_data: data.qr_data ?? true,
            custom_field1: data.custom_field1 ?? "",
            custom_field2: data.custom_field2 ?? "",
            certificate_template: (String(data.certificate_template || "classic").trim() || "classic"),
            default_category: data.default_category ?? "",
        },
    });
    return { ...row, certificate_template: row.certificate_template || "classic", default_category: row.default_category || "" };
};
export { getProviderByUserId, createProviderWarrantySettings };