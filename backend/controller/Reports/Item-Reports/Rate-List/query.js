import { Provider , FranchiseInventory } from "../../../../prisma/db-models.js";


const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
};

const getProviderProducts = async (provider_id, franchise_id) => {
    const products =  await FranchiseInventory.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            product_status: 'active'
        }
    })
    return products;
};

export { getProviderByUserId , getProviderProducts };