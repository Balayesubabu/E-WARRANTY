import { Lead, Provider } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}
const getProviderLeads = async (provider_id) => {
    const leads = await Lead.findMany({
        where: {
            provider_id: provider_id
        },
        include: {
            franchise: true,
            franchise_service: true,
            franchise_service_package: true,
        }
    });
    return leads;
}

export { getProviderByUserId, getProviderLeads };