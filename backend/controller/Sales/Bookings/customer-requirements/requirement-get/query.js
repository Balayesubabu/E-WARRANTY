import { Provider,CustomerRequirements } from "../../../../../prisma/db-models.js";
const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const getAllCustomerRequirements = async (provider_id, franchise_id) => {
    const requirement = await CustomerRequirements.findMany({
        where: { provider_id: provider_id, franchise_id: franchise_id }
    });
    return requirement;
}

export { getProviderByUserId, getAllCustomerRequirements };