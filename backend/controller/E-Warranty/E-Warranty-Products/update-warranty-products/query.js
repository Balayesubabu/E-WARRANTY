import { Provider, ProviderProductWarrantyCode } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getWarrantyProductByGroupId = async (group_id, provider_id) => {
    const warranty_products = await ProviderProductWarrantyCode.findMany({
        where: {
            group_id: group_id,
            provider_id: provider_id
        }
    });
    return warranty_products;
};

const updateWarrantyProductTerms = async (group_id, provider_id, data) => {
    const updateData = {};
    if (data.terms_and_conditions_link !== undefined) {
        updateData.terms_and_conditions_link = data.terms_and_conditions_link;
    }
    if (data.terms_and_conditions !== undefined) {
        updateData.terms_and_conditions = data.terms_and_conditions;
    }

    const warranty_products = await ProviderProductWarrantyCode.updateMany({
        where: {
            group_id: group_id,
            provider_id: provider_id
        },
        data: updateData
    });
    return warranty_products;
};

export { 
    getProviderByUserId, 
    getWarrantyProductByGroupId,
    updateWarrantyProductTerms
};


// const getProviderByUserId = async (user_id) => {
//     const provider = await Provider.findFirst({
//         where: {
//             user_id: user_id
//         }
//     });
//     return provider;
// };

// const getWarrantyProductById = async (warranty_product_id) => {
//     const warranty_product = await ProviderWarrantyProduct.findUnique({
//         where: {
//             id: warranty_product_id
//         }
//     });
//     return warranty_product;
// };

// const updateWarrantyProduct = async (warranty_product_id, data) => {
//     const warranty_product = await ProviderWarrantyProduct.update({
//         where: {
//             id: warranty_product_id
//         },
//         data: {
//             current_product_factory_number: data.current_product_factory_number,
//             product_type: data.product_type,
//             product_name: data.product_name,
//             product_id: data.product_id,
//             warranty_period: data.warranty_period,
//             warranty_check: data.warranty_check,
//             warranty_check_interval: data.warranty_check_interval,
//             terms_and_conditions: data.terms_and_conditions,
//             link:data.link,
//             is_active: data.is_active,
//             is_deleted: data.is_deleted,
//             deleted_at: data.deleted_at,
//         }
//     });
//     return warranty_product;
// };

// const updatePreviousProductIds = async (warranty_product_id, product_id) => {
//     const warranty_product = await ProviderWarrantyProduct.update({
//         where: {
//             id: warranty_product_id
//         },
//         data: {
//             previous_product_ids: {
//                 push: product_id,
//             }
//         }
//     });
//     return warranty_product;
// };

// export { getProviderByUserId, getWarrantyProductById, updateWarrantyProduct, updatePreviousProductIds };