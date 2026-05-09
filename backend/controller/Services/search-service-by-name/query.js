import { Provider, FranchiseService } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getServiceByName = async (service_name, provider_id, franchise_id) => {
    const service = await FranchiseService.findMany({
        where: {
            provider_id: provider_id,
            service_is_deleted: false,
            service_is_active: true,
            franchise_id: franchise_id,
            service_name: {
                contains: service_name,
                mode: 'insensitive'
            }
        },
        orderBy: {
            service_name: "asc"
        }
    })
    return service;
}

export { getProviderByUserId, getServiceByName };