import { Provider, ProviderWarrantyProduct } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getWarrantyProductById = async (warranty_product_id) => {
    const warranty_product = await ProviderWarrantyProduct.findUnique({
        where: {
            id: warranty_product_id
        }
    });
    return warranty_product;
};

const deleteWarrantyProduct = async (warranty_product_id) => {
    const warranty_product = await ProviderWarrantyProduct.delete({
        where: {
            id: warranty_product_id
        }
    });
    return warranty_product;
};

export { getProviderByUserId, getWarrantyProductById, deleteWarrantyProduct };