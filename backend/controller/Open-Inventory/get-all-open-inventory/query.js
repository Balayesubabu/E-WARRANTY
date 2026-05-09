import { Provider, FranchiseOpenInventory } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider;
};

const getAllOpenInventory = async (provider_id, franchise_id, staff_id) => {
    const open_inventory = await FranchiseOpenInventory.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            staff_id: staff_id,
        },
        include:{
            franchise_inventories: true
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    return open_inventory;
};

export { getProviderByUserId, getAllOpenInventory };