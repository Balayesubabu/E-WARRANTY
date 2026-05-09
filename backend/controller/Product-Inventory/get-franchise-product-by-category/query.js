import { FranchiseInventory, Provider } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({ where: { user_id } });
    return provider;
}

const getFranchiseInventoryByCategoryId = async (category_id, franchise_id) => {
    const franchise_inventory = await FranchiseInventory.findMany({
        where: {
            category_id, franchise_id
        },
        include: {
            // category: true,
            provider: true,
            franchise: true,
        }
    });
    return franchise_inventory;
}

export { getProviderByUserId, getFranchiseInventoryByCategoryId };
