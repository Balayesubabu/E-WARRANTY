import { FranchiseService, FranchiseServicePackage, Provider } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getServiceById = async (service_id) => {
    const service = await FranchiseService.findUnique({
        where: {
            id: service_id
        }
    });
    return service;
}

const createPackage = async (data, price) => {
    const servicePackage = await FranchiseServicePackage.create({
        data: {
            provider_id: data.provider_id,
            franchise_id: data.franchise_id,
            staff_id: data.staff_id,
            package_name: data.name,
            package_description: data.description,
            package_price: price,
            services: {
                connect: data.services.map(service => ({ id: service }))
            },
            duration: data.duration,
            created_at: new Date(),
            created_by: data.staff_id || data.provider_id
        }
    });
    return servicePackage;
}

export { getProviderByUserId, getServiceById, createPackage };