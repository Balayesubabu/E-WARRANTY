import { Provider, FranchiseInventory } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getProviderProductsByMultipleIdsQuery = async (product_ids) => {
    const provider_products = await FranchiseInventory.findMany({
        where: {
            id: {
                in: product_ids
            }
        }
    });
    return provider_products;
};

export { getProviderByUserId, getProviderProductsByMultipleIdsQuery };