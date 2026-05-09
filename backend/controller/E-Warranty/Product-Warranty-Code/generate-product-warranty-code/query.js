import { Provider, ProviderProductWarrantyCode, ProviderWarrantySetting, FranchiseInventory } from "../../../../prisma/db-models.js";

/**
 * Get product_item_code (and product_name) from FranchiseInventory for warranty item code from system.
 * Returns null if not found or not belonging to provider (safe for missing/invalid id).
 */
const getFranchiseInventoryItemCode = async (provider_id, franchise_inventory_id) => {
    if (!franchise_inventory_id || !provider_id) return null;
    try {
        const row = await FranchiseInventory.findFirst({
            where: { id: franchise_inventory_id, provider_id },
            select: { product_item_code: true, product_name: true },
        });
        return row ? { product_item_code: row.product_item_code || null, product_name: row.product_name || null } : null;
    } catch {
        return null;
    }
};

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getProviderById = async (provider_id) => {
    const provider = await Provider.findFirst({
        where: { id: provider_id }
    });
    return provider;
}

const updateProviderWarrantySerialNumber = async (provider_id, serial_number) => {
    const provider = await Provider.update({
        where: { id: provider_id },
        data: { warranty_serial_number: serial_number }
    });
    return provider;
}

const createWarrantyCode = async (
    provider_id,
    product_name,
    type,
    other_type,
    vehicle_number,
    product_id,
    service_id,
    serNo,
    warranty_from,
    warranty_to,
    quantity,
    sequence_no,
    warranty_id,
    warranty_check,
    warranty_check_interval,
    warranty_interval_dates,
    warranty_reminder_days,
    terms_and_conditions,
    terms_and_conditions_link,
    group_id,
    warranty_days,
    warranty_period_readable,
    is_active,
    activation_token,
    batch_id,
    assigned_dealer_id,
    factory_item_number,
    factory_service_number,
    franchise_inventory_id) => {
    const warranty_code = await ProviderProductWarrantyCode.create({
        data: {
            provider_id: provider_id,
            franchise_inventory_id: franchise_inventory_id || null,
            product_name: product_name,
            type: type,
            other_type: other_type,
            vehicle_number: vehicle_number,
            product_id: product_id,
            service_id: service_id,
            serial_no: serNo,
            warranty_from: warranty_from,
            warranty_to: warranty_to,
            quantity: quantity,
            sequence_no: sequence_no,
            warranty_code: warranty_id,
            warranty_check: warranty_check,
            warranty_check_interval: warranty_check_interval,
            warranty_interval_dates: warranty_interval_dates,
            group_id: group_id,
            terms_and_conditions: terms_and_conditions,
            terms_and_conditions_link: terms_and_conditions_link,
            warranty_reminder_days: warranty_reminder_days,
            warranty_days: warranty_days,
            warranty_period_readable: warranty_period_readable,
            activation_token: activation_token || null,
            batch_id: batch_id || null,
            assigned_dealer_id: assigned_dealer_id || null,
            factory_item_number: factory_item_number || null,
            factory_service_number: factory_service_number || null,
            warranty_code_status: "Inactive",
            is_active: is_active
        }
    });
    return warranty_code;
}

const getProviderWarrantySettings = async (provider_id) => {
    const provider_warranty_settings = await ProviderWarrantySetting.findFirst({
        where: { provider_id: provider_id },
        orderBy: { updated_at: 'desc' },
        select: { registration_url: true },
    });
    if (!provider_warranty_settings) {
        return null;
    }
    return provider_warranty_settings.registration_url;
};

export { getProviderByUserId, getProviderById, createWarrantyCode, updateProviderWarrantySerialNumber, getProviderWarrantySettings, getFranchiseInventoryItemCode };