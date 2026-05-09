import { Provider, ProviderWarrantyProduct } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const searchWarrantyProductByName = async (search_query) => {
    const warranty_products = await ProviderWarrantyProduct.findMany({
        where: {
            product_name: {
                contains: search_query,
                mode: 'insensitive'
            }
        }
    });
    return warranty_products;
};

export { getProviderByUserId, searchWarrantyProductByName };