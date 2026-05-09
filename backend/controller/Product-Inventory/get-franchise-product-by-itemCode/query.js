import { FranchiseInventory, Provider } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({ where: { user_id } });
    return provider;
}

const getFranchiseInventoryByItemCode = async (provider_id,item_code, franchise_id) => {
    const franchise_inventory = await FranchiseInventory.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            product_item_code: item_code
        }
        
    });
    return franchise_inventory;
}

export { getProviderByUserId, getFranchiseInventoryByItemCode };