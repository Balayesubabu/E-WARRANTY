import { Provider, FranchiseOpenInventory,FranchiseInventory, FranchiseInventoryTransaction} from "../../../prisma/db-models.js";


const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}   


const createOpenInventory = async (data, staff_id, franchise_id, provider_id,itemCodeList) => {
    console.log(data, franchise_id, provider_id);
    let openInventoryList = [];
    const itemCodes = itemCodeList

    for (let open_inventory_item_code of itemCodes) {
        // Check if the record already exists
        let existingInventory = await FranchiseOpenInventory.findFirst({
            where: {
                open_inventory_item_code: open_inventory_item_code,
                franchise_id: franchise_id,
                provider_id: provider_id
            }
        });

        if (existingInventory) {
            // If exists, push the existing record
            openInventoryList.push(existingInventory);
        } else {
            // If not exists, create a new one
            const newInventory = await FranchiseOpenInventory.create({
                data: {
                    franchise_inventory_id: data.franchise_inventory_id,
                    product_id: data.product_id,
                    product_name: data.product_name,
                    product_hsn_code: data.product_hsn_code,
                    product_item_code: data.product_item_code,
                    open_inventory_item_code: open_inventory_item_code,
                    product_custom_code: data.product_custom_code,
                    product_image: data.product_image,
                    product_description: data.product_description,
                    product_quantity: data.product_quantity,
                    product_measurement: data.product_measurement,
                    product_measuring_unit: data.product_measuring_unit,
                    secondary_measuring_unit: data.secondary_measuring_unit,
                    convertion_rate: data.convertion_rate,
                    product_gst_percentage: data.product_gst_percentage,
                    product_gst_amount: data.product_gst_amount,
                    product_original_price: data.product_original_price,
                    product_total_price: data.product_total_price,
                    product_selling_price: data.product_selling_price,
                    product_purchase_price: data.product_purchase_price,
                    product_status: data.product_status,
                    category_id: data.category_id,
                    franchise_id: franchise_id,
                    provider_id: provider_id,
                    staff_id: staff_id || null,
                    created_at: new Date(),
                    created_by: staff_id || provider_id 
                }
            });

            openInventoryList.push(newInventory);
        }
    }

    return openInventoryList;
}

const getFranchiseInventoryById = async (franchise_inventory_id, franchise_id, provider_id) => {
    const franchiseInventory = await FranchiseInventory.findFirst({
        where: {
            id: franchise_inventory_id,
            franchise_id: franchise_id,
            provider_id: provider_id
            }
    });
    console.log(franchiseInventory);
    return franchiseInventory;
}

const updateFranchiseInventoryQuantity = async (franchise_inventory_id, open_inventory_quantity,update_inventory_quantity) => {
    const franchiseInventory = await FranchiseInventory.update({
        where: {
            id: franchise_inventory_id
        },
        data: {
            product_quantity: update_inventory_quantity,
            open_inventory: true,
            open_inventory_quantity: open_inventory_quantity
        }
    });
    return franchiseInventory;
}

const getItemcodeFromProvider = async (provider_id, item_code,franchise_id) => {
        const itemCode = await FranchiseOpenInventory.findFirst({
        where: {
            provider_id: provider_id,
            open_inventory_item_code: item_code,
            franchise_id: franchise_id
        }
        })
        return itemCode;
}

const createOpenInventoryTransactions = async (franchise_inventory_id, provider_id,franchise_id, open_inventory_quantity, updated_quantity ) => {
    const create_franchise_transaction = await FranchiseInventoryTransaction.create({
        data: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            franchise_inventory_id: franchise_inventory_id,
            quantity: open_inventory_quantity,
            action: "reduce",
            closing_stock: updated_quantity,
            stock_changed_by: "openInventory",
            updated_at: new Date()
        }
    })
    return create_franchise_transaction;
}


export { getProviderByUserId, createOpenInventory, getFranchiseInventoryById,updateFranchiseInventoryQuantity,getItemcodeFromProvider,createOpenInventoryTransactions};