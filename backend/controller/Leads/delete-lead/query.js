import { Provider, Lead } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getLeadById = async (provider_id, lead_id) => {
    const lead = await Lead.findFirst({
        where: {
            id: lead_id,
            provider_id: provider_id
        }
    });
    return lead;
}

const deleteLead = async (provider_id, lead_id) => {
    const lead = await Lead.delete({
        where: {
            id: lead_id,
            provider_id: provider_id
        }
    });
    return lead;
}

export { getProviderByUserId, getLeadById, deleteLead };