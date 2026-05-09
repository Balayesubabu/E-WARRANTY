import { ProviderWarrantyCustomer, Provider ,ProviderDealer,ProviderProductWarrantyCode,ProviderWarrantySetting} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getPendingCustomers = async (warranty_code, registered_customer_id) => {
    const pending_customer = await ProviderWarrantyCustomer.findFirst({
        where: {
            id: registered_customer_id,
            provider_warranty_code: {
                warranty_code: warranty_code,
                warranty_code_status: "Pending"
            }
        },
        include: {
            provider: true,
            provider_warranty_code: true
        }
    })
    return pending_customer;
}

const updatePendingCustomersToActive = async (warranty_code, registered_customer_id) => {
    const updated_customer = await ProviderWarrantyCustomer.update({
        where: {
            id: registered_customer_id,
            provider_warranty_code: {
                warranty_code: warranty_code,
                warranty_code_status: "Pending"
            }
        },
        data: {
            provider_warranty_code: {
                update: {
                    warranty_code_status: "Active"
                }
            }
        },
        include: {
            provider: true,
            provider_warranty_code: true
        }
    })
    return updated_customer;
}

const getWarrantyCodeByWarrantyCode = async (warranty_code) => {
    const warranty_code_data = await ProviderProductWarrantyCode.findFirst({
        where: {
            warranty_code: warranty_code
        }
    });
    return warranty_code_data;
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

const getProviderById = async (provider_id) => {
    const provider = await Provider.findUnique({
        where: {
            id: provider_id
        }
    });
    console.log(provider);
    return provider;
}

const getSettingsByProviderId = async (provider_id) => {
    const row = await ProviderWarrantySetting.findFirst({
        where: { provider_id: provider_id },
        orderBy: { updated_at: 'desc' },
        select: { id: true, registration_url: true, custom_field1: true, custom_field2: true, certificate_template: true },
    });
    return row ? { ...row, certificate_template: row.certificate_template || "classic" } : null;
}

export { getProviderByUserId, getPendingCustomers, updatePendingCustomersToActive,getWarrantyCodeByWarrantyCode,getDealerByDealerId,getWarrantyRegisterCustomerById,getProviderById,getSettingsByProviderId};