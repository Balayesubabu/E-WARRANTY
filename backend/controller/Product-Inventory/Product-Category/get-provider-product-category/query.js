import { Provider, Category } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {    
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider;
}

const getProviderProductCategory = async (provider_id) => {
    const product_categories = await Category.findMany({
        where: {
            provider_id: provider_id,
            is_active: true,
            is_deleted: false,
        },
    });
    return product_categories;
}

export { getProviderByUserId, getProviderProductCategory };