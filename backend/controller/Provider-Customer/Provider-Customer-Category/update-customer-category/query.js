import { Provider, CustomerCategory } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const updateCustomerCategory = async (customer_category_id, data, provider_id) => {
    const customer_category = await CustomerCategory.update({
        where: {
            id: customer_category_id,
            provider_id: provider_id
        },
        data: {
            customer_category_name: data.customer_category_name,
            customer_category_description: data.customer_category_description,
            is_active: data.is_active,
            is_deleted: data.is_deleted,
            deleted_at: data.deleted_at,
        }
    })
    return customer_category;
}

export { getProviderByUserId, updateCustomerCategory };