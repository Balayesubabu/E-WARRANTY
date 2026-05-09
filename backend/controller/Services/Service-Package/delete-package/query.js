import { FranchiseServicePackage, Provider } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getServicePackageById = async (package_id, provider_id) => {
    const servicePackage = await FranchiseServicePackage.findFirst({
        where: {
            id: package_id,
            provider_id: provider_id
        }
    });
    return servicePackage;
}

const deletePackage = async (package_id, provider_id) => {
    const deletedPackage = await FranchiseServicePackage.delete({
        where: { id: package_id, provider_id: provider_id }
    });
    return deletedPackage;
}

export { getProviderByUserId, getServicePackageById, deletePackage };