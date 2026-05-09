import { FranchiseInventory, Provider } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const deleteFranchiseInventory = async (franchise_inventory_id) => {
    const franchiseInventory = await FranchiseInventory.delete({
        where: {
            id: franchise_inventory_id
        }
    })
    return franchiseInventory;
}

export { getProviderByUserId, deleteFranchiseInventory };