import {Provider, FranchiseInventory} from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
   const provider =   await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider
}

const getFranchiseInventoryById = async (id , provider_id, franchise_id) => {
    const product = await FranchiseInventory.findFirst({
        where: {
            id: id,
            provider_id: provider_id,
            franchise_id: franchise_id
        }
    })
    return product
}


export {getProviderByUserId, getFranchiseInventoryById}