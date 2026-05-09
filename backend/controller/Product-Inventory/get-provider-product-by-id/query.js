import { Provider, FranchiseInventory } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getProductById = async (product_id, provider_id) => {
    const product = await FranchiseInventory.findFirst({
        where: {
            id: product_id,
            provider_id: provider_id
        }
        // include: {
        //     // category: true,
        // }
    });
    return product;
};

export { getProviderByUserId, getProductById };