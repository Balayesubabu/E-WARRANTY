import { Provider, ProviderBankDetails } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        },
        include: {
            ProviderBankDetails: true
        }
    })
    return provider;
}

const createBankDetails = async (provider_id, data, is_primary) => {
    const bank_details = await ProviderBankDetails.create({
        data: {
            provider_id: provider_id,
            bank_name: data.bank_name,
            bank_account_number: data.bank_account_number,
            bank_ifsc_code: data.bank_ifsc_code,
            bank_branch_name: data.bank_branch_name,
            bank_account_holder_name: data.bank_account_holder_name,
            bank_account_holder_address: data.bank_account_holder_address,
            bank_account_holder_email: data.bank_account_holder_email,
            bank_account_holder_phone: data.bank_account_holder_phone,
            is_primary: is_primary
        }
    })
    return bank_details;
}

export { getProviderByUserId, createBankDetails };