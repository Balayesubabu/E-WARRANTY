import { Provider, ProviderBankDetails } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const deleteBankDetails = async (provider_id, bank_detail_id) => {
    const bank_details = await ProviderBankDetails.delete({
        where: {
            id: bank_detail_id,
            provider_id: provider_id
        }
    })
    return bank_details;
}

export { getProviderByUserId, deleteBankDetails };
