import { Provider, QuickSettings } from "../../../prisma/db-models.js";


const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
      is_deleted: false,
    },
    include: {
      user: true,
    },
  });
  return provider;
};

const updateQuickSettings = async (provider_id, franchise_id, data) => {
    const existingQuickSetting = await QuickSettings.findFirst({
        where: {
            provider_id : provider_id,
            franchise_id : franchise_id,
            invoice_type:data.invoice_type
        }
    })
    if (!existingQuickSetting){
        const createQuickSetting = await QuickSettings.create({
            data : {
                provider_id : provider_id,
                franchise_id : franchise_id,
                prefix : data.prefix,
                sequence_number : data.sequence_number,
                invoice_type:data.invoice_type
            }
        })
        return createQuickSetting;
    }
    
    const updateQuickSetting = await QuickSettings.update({
        where: {
                id: existingQuickSetting.id 
            },
       data : {
                provider_id : provider_id,
                franchise_id : franchise_id,
                prefix : data.prefix,
                sequence_number : data.sequence_number,
                invoice_type:data.invoice_type
            }
    })
   return updateQuickSetting
}

export {getProviderByUserId, updateQuickSettings}