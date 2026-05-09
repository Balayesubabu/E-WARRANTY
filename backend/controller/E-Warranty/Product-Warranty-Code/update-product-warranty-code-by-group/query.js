import { Provider, ProviderProductWarrantyCode } from "../../../../prisma/db-models.js"

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst(
        {
            where: {
                user_id: user_id
            }
        }
    )

    return provider;
}

const updateProductWarrantyCodeByGroup = async (group_id, provider_id, data) => {
    const productWarrantyCode = await ProviderProductWarrantyCode.updateMany({
        where: {
            group_id: group_id,
            provider_id: provider_id
        },
        data: {
            terms_and_conditions: data.terms_and_conditions,
            warranty_from: data.warranty_from,
            warranty_to: data.warranty_to,
            warranty_days: data.warranty_days,
            warranty_check: data.warranty_check,
            warranty_check_interval: data.warranty_check_interval,
            warranty_interval_dates: data.warranty_interval_dates,
            warranty_reminder_days: data.warranty_reminder_days
        }
    })

    return productWarrantyCode;
}

export {
    getProviderByUserId,
    updateProductWarrantyCodeByGroup
}