import { ProviderWarrantyCustomer, Provider } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getActiveCustomers = async (provider_id, dealer_id = null) => {
    const whereClause = {
        provider_id: provider_id,
        is_active: true,
    };
    // If dealer_id is provided, only show customers registered by this dealer
    if (dealer_id) {
        whereClause.dealer_id = dealer_id;
    }

    const active_customers = await ProviderWarrantyCustomer.findMany({
        where: {
            ...whereClause,
            provider_warranty_code: {
                warranty_code_status: "Active",
                warranty_to: {
                    gte: new Date()
                }
            }
        },
        include: {
            provider_warranty_code: true,
            provider: true
        }
    });
    return active_customers;
}

export { getProviderByUserId, getActiveCustomers };