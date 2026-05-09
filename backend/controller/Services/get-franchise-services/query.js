import { Provider, FranchiseService } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const getProviderServices = async (provider_id, franchise_id) => {
    const services = await FranchiseService.findMany({
        where: { provider_id: provider_id, service_is_deleted: false, franchise_id: franchise_id },
        orderBy: { created_at: 'desc' }
    });
    return services;
}

export { getProviderByUserId, getProviderServices };
