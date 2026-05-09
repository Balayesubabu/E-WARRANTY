import { Provider, Franchise, FranchiseServicePackage } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getFranchiseById = async (franchise_id) => {
    const franchise = await Franchise.findFirst({
        where: {
            id: franchise_id
        }
    });
    return franchise;
}

const getFranchisePackages = async (franchise_id, provider_id) => {
    const franchisePackages = await FranchiseServicePackage.findMany({
        where: {
            franchise_id: franchise_id,
            provider_id: provider_id
        },
        include: {
            services: true
        },
        orderBy: { created_at: 'desc' }
    });
    return franchisePackages;
}

export { getProviderByUserId, getFranchiseById, getFranchisePackages };
