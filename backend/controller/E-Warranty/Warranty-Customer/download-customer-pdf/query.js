import { ProviderWarrantyCustomer,Provider,ProviderDealer,ProviderProductWarrantyCode,ProviderWarrantySetting} from "../../../../prisma/db-models.js";

const getWarrantyRegisterCustomerById = async (warranty_register_customer_id) => {
    const dealer = await ProviderWarrantyCustomer.findUnique({
        where: {
            id: warranty_register_customer_id
        },
        include: {
            provider: true
        }
    });
    return dealer;
}

const getWarrantyCodeByWarrantyCode = async (warranty_code) => {
    const warranty_code_data = await ProviderProductWarrantyCode.findFirst({
        where: {
            warranty_code: warranty_code
        }
    });
    return warranty_code_data;
}

const checkIfWarrantyCodeIsRegistered = async (warranty_code) => {
    const warranty_code_data = await ProviderWarrantyCustomer.findFirst({
        where: {
            warranty_code: warranty_code
        }
    });
    return warranty_code_data;
}
const getProviderById = async (provider_id) => {
    const provider = await Provider.findUnique({
        where: {
            id: provider_id
        }
    });
    return provider;
}
const getDealerByDealerId = async (dealer_id) => {
    const dealer = await ProviderDealer.findUnique({
        where: {
            id: dealer_id
        },
        include: {
            provider: true
        }
    });
    return dealer;
}
const getSettingsByProviderId = async (provider_id) => {
    const row = await ProviderWarrantySetting.findFirst({
        where: { provider_id: provider_id },
        orderBy: { updated_at: 'desc' },
        select: { id: true, registration_url: true, custom_field1: true, custom_field2: true, certificate_template: true },
    });
    return row ? { ...row, certificate_template: row.certificate_template || "classic" } : null;
}


export { getWarrantyRegisterCustomerById,getWarrantyCodeByWarrantyCode,checkIfWarrantyCodeIsRegistered,getProviderById,getDealerByDealerId,getSettingsByProviderId};