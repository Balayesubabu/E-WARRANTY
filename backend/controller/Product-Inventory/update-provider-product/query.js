import { FranchiseInventory, Provider, FranchiseInventoryTransaction } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({ where: { user_id } });
    return provider;
}

const getFranchiseInventoryById = async (franchise_inventory_id) => {
    const franchise_inventory = await FranchiseInventory.findFirst({ where: { id: franchise_inventory_id } });
    return franchise_inventory;
}

const updateProviderProduct = async (franchise_inventory_id, data, provider_id, franchise_id, staff_id) => {
    const provider_product = await FranchiseInventory.update({
        where: { id: franchise_inventory_id },
        data: {
            product_id: data.product_id,
            product_name: data.product_name,
            product_hsn_code: data.product_hsn_code,
            product_item_code: data.product_item_code,
            product_custom_code: data.product_custom_code,
            product_image: data.product_images,
            product_description: data.product_description,
            product_purchase_price: data.product_purchase_price,
            product_selling_price: data.product_selling_price,
            product_sales_price_type : data.product_sales_price_type,
            product_purchase_price_type : data.product_purchase_price_type,
            product_selling_price_input : data.product_selling_price_input,
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
            category_id: data.category_id,
            product_quantity: data.product_quantity,
            updated_by: staff_id || provider_id,
            updated_at:new Date()
        }
    });
    return provider_product;
}

const createFranchiseTransaction = async (provider_id, franchise_id, franchise_inventory_id, product_quantity) => {
    const create_franchise_transaction = await FranchiseInventoryTransaction.create({
        data: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            franchise_inventory_id: franchise_inventory_id,
            quantity: product_quantity,
            action: "adjustment",
            closing_stock: product_quantity,
            stock_changed_by: "self",
        }
    });
    return create_franchise_transaction;
}

export { getProviderByUserId, getFranchiseInventoryById, updateProviderProduct, createFranchiseTransaction };
