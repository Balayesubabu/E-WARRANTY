import { Provider, CustomerCategory } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getCustomerCategory = async (provider_id) => {
    const customer_category = await CustomerCategory.findMany({
        where: {
            provider_id: provider_id,
            is_deleted: false,
            is_active: true
        }
    })
    return customer_category;
}

export { getProviderByUserId, getCustomerCategory };