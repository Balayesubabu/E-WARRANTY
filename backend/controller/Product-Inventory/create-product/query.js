import { Provider, FranchiseInventory } from "../../../prisma/db-models.js";


const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider;
}

const createProduct = async (data, product_image, provider_id, franchise_id, staff_id) => {
    // Step 1: Check if item code already exists
    const existingProduct = await FranchiseInventory.findFirst({
        where: {
            product_item_code: data.product_item_code,
            provider_id: provider_id,
            franchise_id: franchise_id,
        },
    });

    if (existingProduct) {
        throw new Error("Item code already exists for this provider and franchise.");
    }

    // Step 2: Create the product if item code is unique
    const product = await FranchiseInventory.create({
        data: {
            provider_id: provider_id,
            product_id: data.product_id,
            product_name: data.product_name,
            product_hsn_code: data.product_hsn_code,
            product_item_code: data.product_item_code,
            product_custom_code: data.product_custom_code,
            product_image: product_image,
            product_description: data.product_description,
            product_purchase_price: data.product_purchase_price,
            product_selling_price: data.product_selling_price,
            product_sales_price_type : data.product_sales_price_type,
            product_purchase_price_type : data.product_purchase_price_type,
            product_selling_price_input : data.product_selling_price_input,
            product_quantity: data.product_quantity,
            product_measurement: data.product_measurement,
            product_measuring_unit: data.product_measuring_unit,
            secondary_measuring_unit: data.secondary_measuring_unit,
            convertion_rate: data.convertion_rate,
            product_gst_percentage: data.product_gst_percentage,
            product_gst_amount: data.product_gst_amount,
            product_original_price: data.product_original_price,
            product_total_price: data.product_total_price,
            product_status: data.product_status,
            product_low_stock_level: data.product_low_stock_level,
            product_reorder_level: data.product_reorder_level,
            category_id: data.category_id || null,
            staff_id: staff_id || null,
            franchise_id: franchise_id,
            created_by: staff_id || provider_id,
            created_at: new Date()
        }
    });

    return product;
};

export { getProviderByUserId, createProduct };