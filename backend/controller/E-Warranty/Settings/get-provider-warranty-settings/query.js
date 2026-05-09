import { Provider, ProviderWarrantySetting } from "../../../../prisma/db-models.js";

// Lookup provider by its own id (used by the public :provider_id route)
const getProviderById = async (provider_id) => {
    const provider = await Provider.findUnique({
        where: {
            id: provider_id
        }
    });
    return provider;
};

// Lookup provider by the User table id (used by the authenticated route)
const getProviderByUserIdField = async (user_id) => {
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
        select: {
            id: true,
            provider_id: true,
            registration_url: true,
            qr_data_to_url: true,
            qr_data: true,
            custom_field1: true,
            custom_field2: true,
            certificate_template: true,
            default_category: true,
            provider: { select: { id: true, company_name: true } },
        },
    });
    return row ? {
        ...row,
        certificate_template: row.certificate_template || "classic",
        default_category: row.default_category || ""
    } : null;
};

export { getProviderById, getProviderByUserIdField, getProviderWarrantySettings };