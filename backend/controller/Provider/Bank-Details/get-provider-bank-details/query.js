import { Provider, ProviderBankDetails } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getProviderBankDetails = async (provider_id) => {
    const bank_details = await ProviderBankDetails.findMany({
        where: {
            provider_id: provider_id,
            is_deleted: false,
            is_active: true
        },
        orderBy: {
            created_at: 'asc'
        }
    })
    return bank_details;
}

export { getProviderByUserId, getProviderBankDetails };
