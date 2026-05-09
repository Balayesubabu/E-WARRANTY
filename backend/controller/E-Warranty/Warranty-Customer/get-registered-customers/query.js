import { ProviderWarrantyCustomer, Provider } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getRegisteredCustomers = async (provider_id, dealer_id = null) => {
    const whereClause = {
        provider_id: provider_id,
    };
    // If dealer_id is provided, only show customers registered by this dealer
    if (dealer_id) {
        whereClause.dealer_id = dealer_id;
    }

    const registered_customers = await ProviderWarrantyCustomer.findMany({
        where: whereClause,
        include: {
            provider: true,
            provider_warranty_code: true
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    return registered_customers;
}

export { getProviderByUserId, getRegisteredCustomers };