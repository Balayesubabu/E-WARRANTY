import { FranchiseService, Provider } from "../../../prisma/db-models.js";


const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}
const deleteService = async (service_id, provider_id, franchise_id, staff_id) => {
    const deletedService = await FranchiseService.update({
        where: {
            id: service_id,
            provider_id: provider_id,
            franchise_id: franchise_id
        },
        data: {
            service_is_deleted: true,
            service_is_active: false,
            updated_at: new Date(),
            updated_by: staff_id || provider_id
        }
    });
    return deletedService;
}

export { deleteService, getProviderByUserId };