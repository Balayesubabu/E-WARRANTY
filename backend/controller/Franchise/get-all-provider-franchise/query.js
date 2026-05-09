import { Provider, Franchise } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getFranchisesByProviderId = async (provider_id) => {
    const franchises = await Franchise.findMany({
        where: {
            provider_id: provider_id
        },
        orderBy: { created_at: 'asc' }
    });
    return franchises;
}

export { getProviderByUserId, getFranchisesByProviderId };