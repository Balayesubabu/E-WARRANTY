import { Provider, ProviderTax } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getProviderTaxByType = async (provider_id, tax_type) => {
    const providerTax = await ProviderTax.findMany({
        where: {
            provider_id: provider_id,
            tax_type: tax_type
        }
    })
    return providerTax;
}

export {
    getProviderByUserId,
    getProviderTaxByType
}