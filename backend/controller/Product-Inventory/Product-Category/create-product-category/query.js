import { Provider, Category } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider;
}

const createProductCategory = async (data, provider_id) => {
    const product_category = await Category.create({
        data: {
            category_name: data.category_name,
            category_description: data.category_description,
            provider_id: provider_id,
        },
    });
    return product_category;
}

export { getProviderByUserId, createProductCategory };