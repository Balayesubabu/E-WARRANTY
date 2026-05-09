import { Provider, FranchiseInventory } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

//mayank
// const searchByProductName = async (search_term, provider_id) => {
//     const product = await FranchiseInventory.findMany({
//         where: {
//             provider_id: provider_id,
//             product_is_deleted: false,
//             product_is_active: true,
//             product_name: {
//                 contains: product_name,
//                 mode: 'insensitive'
//             }
//         }
//     })
//     return product;
// }

//akash
const searchByProductName = async (search_term, provider_id, franchise_id) => {
    if (!search_term || !provider_id) return [];

    search_term = search_term.trim();

    const product = await FranchiseInventory.findMany({
        where: {
            AND: [
                { provider_id: provider_id,
                    franchise_id: franchise_id
                },
                {
                    OR: [
                        { product_name: { contains: search_term, mode: 'insensitive' } },
                        { product_hsn_code: { contains: search_term, mode: 'insensitive' } },
                        { product_id: { contains: search_term, mode: 'insensitive' } },
                        { product_item_code: { contains: search_term, mode: 'insensitive' } },
                        { product_description: { contains: search_term, mode: 'insensitive' } }
                    ]
                }
            ]
        },
        orderBy: {
            product_name: "asc"
        },
        include: {
            // category: true,
            franchise: true
        }
    });

    return product;
}
export { getProviderByUserId, searchByProductName };