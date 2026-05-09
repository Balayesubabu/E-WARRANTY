import { Provider, FranchiseOpenInventory, FranchiseOpenInventoryTransaction } from "../../../prisma/db-models.js";

const getProviderByUserId = async (userId) => {
    return await Provider.findFirst({
        where: {
            user_id: userId
        }
    });
}

const getAllOpenInventory = async (provider_id,franchise_id) => {
    const getEachOpenInventory = await FranchiseOpenInventory.findMany({
        where: {
            franchise_id: franchise_id,
            provider_id: provider_id
        }
    });
    console.log(getEachOpenInventory);
    return getEachOpenInventory;
}

const getConsumedStock = async (openInventory_id,provider_id, franchise_id) => {
    const consumedStock = await FranchiseOpenInventoryTransaction.groupBy({
        by: ['franchise_open_inventory_id', 'measurement_unit'],
        where: {
            franchise_id: franchise_id,
            provider_id: provider_id,
            franchise_open_inventory_id: openInventory_id,
            action: 'reduce',
        },
        _sum: {
            measurement: true,
        },
    });
    return consumedStock;
}   
        

export { getProviderByUserId, getAllOpenInventory ,getConsumedStock};
