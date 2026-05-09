import { Provider, ProviderBankDetails } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

// const updateBankDetails = async (provider_id, bank_detail_id, data, is_active, is_deleted, deleted_at) => {
//     const bank_details = await ProviderBankDetails.update({
//         where: {
//             id: bank_detail_id,
//             provider_id: provider_id
//         },
//         data: {
//             bank_name: data.bank_name,
//             bank_account_number: data.bank_account_number,
//             bank_ifsc_code: data.bank_ifsc_code,
//             bank_branch_name: data.bank_branch_name,
//             bank_account_holder_name: data.bank_account_holder_name,
//             bank_account_holder_address: data.bank_account_holder_address,
//             bank_account_holder_email: data.bank_account_holder_email,
//             bank_account_holder_phone: data.bank_account_holder_phone,
//             is_primary: data.is_primary,
//             is_active: is_active,
//             is_deleted: is_deleted,
//             deleted_at: deleted_at
//         }
//     })
//     return bank_details;
// }

const updateBankDetails = async (
  provider_id,
  bank_detail_id,
  data,
  is_active,
  is_deleted,
  deleted_at
) => {

    // STEP 1: If new bank is set as primary, reset others
    if (data.is_primary === true) {
      await ProviderBankDetails.updateMany({
        where: {
          provider_id: provider_id,
          is_primary: true
        },
        data: {
          is_primary: false
        }
      });
    }

    // STEP 2: Update selected bank
    const bank_details = await ProviderBankDetails.update({
      where: {
        id: bank_detail_id,
        provider_id: provider_id
      },
      data: {
        bank_name: data.bank_name,
        bank_account_number: data.bank_account_number,
        bank_ifsc_code: data.bank_ifsc_code,
        bank_branch_name: data.bank_branch_name,
        bank_account_holder_name: data.bank_account_holder_name,
        bank_account_holder_address: data.bank_account_holder_address,
        bank_account_holder_email: data.bank_account_holder_email,
        bank_account_holder_phone: data.bank_account_holder_phone,
        is_primary: data.is_primary,
        is_active: is_active,
        is_deleted: is_deleted,
        deleted_at: deleted_at
      }
    });

    return bank_details;
};

export { getProviderByUserId, updateBankDetails };