import { Provider, FranchiseInventory} from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}
const getItemcodeFromProvider = async (provider_id, item_code,franchise_id) => {
        const itemCode = await FranchiseInventory.findFirst({
        where: {
            provider_id: provider_id,
            product_item_code: item_code,
            franchise_id: franchise_id
        }
        })
        return itemCode;
}
export { getProviderByUserId,getItemcodeFromProvider };