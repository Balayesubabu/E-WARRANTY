import {Provider,FranchiseOpenInventory} from "../../../prisma/db-models.js";

const getProviderByUserId = async (userId) => {
    return await Provider.findFirst({
        where: {
            user_id: userId
        }
    });
}

const getAllOpenInventoryByMultipleIds = async (ids, providerId, franchise_id) => {
    return await FranchiseOpenInventory.findMany({
        where: {
            id: {
                in: ids
            },
            provider_id: providerId,
            franchise_id: franchise_id
        },
        include: {
            franchise_inventories: true
        }
    });
}

export { getAllOpenInventoryByMultipleIds, getProviderByUserId };