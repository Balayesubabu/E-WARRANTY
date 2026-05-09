import { Provider, FranchiseInventory, Category} from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider;
}

const getProviderProducts = async (provider_id) => {
    const products = await FranchiseInventory.findMany({
        where: {
            provider_id: provider_id
        },
        include: {
            // category: true,
            franchise: true,
        },
        orderBy: { created_at: 'desc' }
    });
    return products;
}

const getCategoryName = async (provider_id,category_id) => {
    const products = await Category.findUnique({
        where: {
            provider_id: provider_id,
            id:category_id
        }
    });
    return products;
}

export { getProviderByUserId, getProviderProducts,getCategoryName};