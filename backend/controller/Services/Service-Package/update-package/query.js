import { FranchiseService, FranchiseServicePackage, Provider } from "../../../../prisma/db-models.js";

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

const getServiceById = async (service_id) => {
    const service = await FranchiseService.findFirst({
        where: {
            id: service_id
        }
    });
    return service;
}

const updatePackage = async (package_id, provider_id, franchise_id, staff_id, data, price) => {
    const updatedPackage = await FranchiseServicePackage.update({
        where: { id: package_id, provider_id: provider_id, franchise_id: franchise_id },
        data: {
            package_name: data.name,
            package_description: data.description,
            package_price: price,
            services: {
                set: data.services.map(service => ({ id: service }))
            },
            duration: data.duration,
            updated_at: new Date(),
            updated_by: staff_id || provider_id
        }
    });
    return updatedPackage;
}

export { getProviderByUserId, getServicePackageById, getServiceById, updatePackage };
