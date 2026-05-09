import { Provider, ProviderWarrantyProduct } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const createWarrantyProduct = async (data) => {
    const warranty_product = await ProviderWarrantyProduct.create({
        data: {
            provider_id: data.provider_id,
            current_product_factory_number: data.current_product_factory_number,
            product_type: data.product_type,
            product_name: data.product_name,
            product_id: data.product_id,
            warranty_period: data.warranty_period,
            warranty_check: data.warranty_check,
            warranty_check_interval: data.warranty_check_interval,
            terms_and_conditions: data.terms_and_conditions,
            link:data.link
        }
    });
    return warranty_product;
};

export { getProviderByUserId, createWarrantyProduct };