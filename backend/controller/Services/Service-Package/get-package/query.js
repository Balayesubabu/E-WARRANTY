import { Provider, FranchiseServicePackage } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getServicePackageById = async (package_id, provider_id,franchise_id) => {
    const servicePackage = await FranchiseServicePackage.findFirst({
        where: {
            id: package_id,
            provider_id: provider_id,
            franchise_id: franchise_id
        },
        include: {
            services: true
        }
    });
    return servicePackage;
}

export { getProviderByUserId, getServicePackageById };