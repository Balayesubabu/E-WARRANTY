import { FranchiseInventory, Provider } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({ where: { user_id } });
    return provider;
}

const getProductsByCategoryId = async (category_id, provider_id) => {
    const products = await FranchiseInventory.findMany({
        where: { category_id, provider_id },
        include: {
            // category: true,
            provider: true,
            franchise: true,
        }
    });
    return products;
}

export { getProviderByUserId, getProductsByCategoryId };
