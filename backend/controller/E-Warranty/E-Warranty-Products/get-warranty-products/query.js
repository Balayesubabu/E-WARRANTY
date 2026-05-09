import { Provider, ProviderWarrantyProduct } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getWarrantyProducts = async (provider_id) => {
    const warranty_products = await ProviderWarrantyProduct.findMany({
        where: {
            provider_id: provider_id
        }
    });
    return warranty_products;
};

export { getProviderByUserId, getWarrantyProducts };