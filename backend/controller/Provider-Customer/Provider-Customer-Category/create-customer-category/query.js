import { Provider, CustomerCategory } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const createCustomerCategory = async (data, provider_id) => {
    const customerCategory = await CustomerCategory.create({
        data: {
            provider_id: provider_id,
            customer_category_name: data.customer_category_name,
            customer_category_description: data.customer_category_description,
            is_active: true,
            is_deleted: false,
        }
    });
    return customerCategory;
}

export { getProviderByUserId, createCustomerCategory };