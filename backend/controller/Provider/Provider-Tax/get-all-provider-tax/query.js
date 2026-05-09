import { Provider, ProviderTax } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getAllProviderTax = async (provider_id) => {
    const providerTax = await ProviderTax.findMany({
        where: {
            provider_id: provider_id
        }
    })
    return providerTax;
}

export {
    getProviderByUserId,
    getAllProviderTax
}