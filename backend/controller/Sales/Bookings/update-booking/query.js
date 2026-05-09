import {
    Provider,
    ProviderCustomers,
    SalesInvoice,
    SalesPart,
    SalesService,
    SalesInvoiceTransactions,
    Transaction,
    FranchiseInventory,
    SalesInvoiceParty,
    SalesCustomerVehicle,
    prisma
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        },
        include: {
            user: true
        }
    })
    return provider;
}

const getSalesInvoiceById = async (sales_invoice_id) => {
    const salesInvoice = await SalesInvoice.findFirst({
        where: {
            id: sales_invoice_id,
            is_invoice_fully_paid: false,
        },
        include: {
            SalesInvoiceTransactions: true,
            SalesPart: true,
            SalesService: true,
            SalesInvoiceParty: true
        }
    })
    return salesInvoice;
}

const clearSalesInvoice = async (sales_invoice_id) => {
    await prisma.$transaction([
        prisma.salesInvoiceParty.deleteMany({ where: { sales_invoice_id: sales_invoice_id } }),
        prisma.salesPart.deleteMany({ where: { sales_invoice_id: sales_invoice_id } }),
        prisma.salesService.deleteMany({ where: { sales_invoice_id: sales_invoice_id } }),
    ])
}

const getProviderCustomerById = async (provider_customer_id) => {
    const providerCustomer = await ProviderCustomers.findFirst({
        where: {
            id: provider_customer_id
        }
    })
    return providerCustomer;
}

const getFranchiseInventoryById = async (franchise_inventory_id) => {
    const franchiseInventory = await FranchiseInventory.findFirst({
        where: {
            id: franchise_inventory_id,
            product_is_active: true,
            product_is_deleted: false
        }
    })
    return franchiseInventory;
}

const updateSalesInvoice = async (sales_invoice_id, data) => {
    const updatedSalesInvoice = await SalesInvoice.update({
        where: {
            id: sales_invoice_id
        },
        data: {
            provider_customer_id: data.provider_customer_id,
            franchise_id: data.franchise_id,
            original_invoice_number: data.original_invoice_number,
            invoice_type: data.invoice_type,
            invoice_status: data.invoice_status,
            invoice_date: data.invoice_date,
            is_invoice_fully_paid: data.is_invoice_fully_paid,
            invoice_additional_discount_percentage: data.invoice_additional_discount_percentage,
            invoice_additional_discount_amount: data.invoice_additional_discount_amount,
            invoice_tds_percentage: data.invoice_tds_percentage,
            invoice_tcs_percentage: data.invoice_tcs_percentage,
            invoice_shipping_charges: data.invoice_shipping_charges,
            is_auto_round_off: data.is_auto_round_off,
            auto_round_off_amount: data.auto_round_off_amount,
            invoice_advance_amount: data.invoice_advance_amount,
            advance_payment_type: data.advance_payment_type,
            advance_amount_online_transaction_id: data.advance_amount_online_transaction_id,
            advance_payment_date: data.advance_payment_date,
            invoice_payment_status: data.invoice_payment_status,
            terms_and_conditions: data.terms_and_conditions,
            additional_notes: data.additional_notes,
            due_date_terms: data.due_date_terms,
            due_date: data.due_date,
            invoice_total_amount: data.invoice_total_amount,
            invoice_discount_amount: data.invoice_discount_amount,
            invoice_gst_amount: data.invoice_gst_amount,
            invoice_tds_amount: data.invoice_tds_amount,
            invoice_tcs_amount: data.invoice_tcs_amount,
            invoice_pending_amount: data.invoice_pending_amount,
            invoice_paid_amount: data.invoice_paid_amount,
            invoice_total_tax_amount: data.invoice_total_tax_amount,
            invoice_total_parts_amount: data.invoice_total_parts_amount,
            invoice_total_parts_tax_amount: data.invoice_total_parts_tax_amount,
            invoice_total_services_amount: data.invoice_total_services_amount,
            invoice_total_services_tax_amount: data.invoice_total_services_tax_amount,
            invoice_total_parts_services_amount: data.invoice_total_parts_services_amount,
            invoice_total_parts_services_tax_amount: data.invoice_total_parts_services_tax_amount,
        }
    });
    return updatedSalesInvoice;
}

const createSalesParts = async (sales_invoice_id, data) => {
    const salesParts = await SalesPart.create({
        data: {
            ...data,
            sales_invoice_id: sales_invoice_id,
        }
    })
    return salesParts;
}

const updateFranchiseInventory = async (franchise_inventory_id, product_quantity) => {
    const updatedFranchiseInventory = await FranchiseInventory.update({
        where: {
            id: franchise_inventory_id,
            product_is_active: true,
            product_is_deleted: false
        },
        data: {
            product_quantity: product_quantity
        }
    })
    return updatedFranchiseInventory;
}

const restoreFranchiseInventory = async (franchise_inventory_id, quantity_to_restore) => {
    const franchiseInventory = await FranchiseInventory.findFirst({
        where: {
            id: franchise_inventory_id,
            product_is_active: true,
            product_is_deleted: false
        }
    });

    if (franchiseInventory) {
        const updatedFranchiseInventory = await FranchiseInventory.update({
            where: {
                id: franchise_inventory_id,
                product_is_active: true,
                product_is_deleted: false
            },
            data: {
                product_quantity: {
                    increment: quantity_to_restore
                }
            }
        });
        return updatedFranchiseInventory;
    }
    return null;
}

const createSalesServices = async (sales_invoice_id, data) => {
    const salesServices = await SalesService.create({
        data: {
            ...data,
            sales_invoice_id: sales_invoice_id,
        }
    })
    return salesServices;
}

const createSalesInvoiceTransactions = async (sales_invoice_id, data) => {
    const salesInvoiceTransactions = await SalesInvoiceTransactions.create({
        data: {
            sales_invoice_id: sales_invoice_id,
            invoice_type: data.invoice_type,
            amount: data.advance_payment_amount,
            total_amount: data.invoice_total_amount,
            pending_amount: data.invoice_pending_amount,
            paid_amount: data.invoice_paid_amount,
            transaction_type: data.advance_payment_type,
            transaction_id: data.advance_amount_online_transaction_id,
        }
    })
    return salesInvoiceTransactions;
}

const createTransactions = async (sales_invoice_id, data) => {
    const transactions = await Transaction.create({
        data: {
            provider_id: data.provider_id,
            provider_customer_id: data.provider_customer_id,
            sales_invoice_id: sales_invoice_id,
            invoice_type: data.invoice_type,
            amount: data.advance_payment_amount,
            transaction_type: data.advance_payment_type,
            transaction_id: data.advance_amount_online_transaction_id,
        }
    })
    return transactions;
}

const updateProviderCustomerFinalBalance = async (provider_customer_id, customer_final_balance) => {
    const providerCustomerFinalBalance = await ProviderCustomers.update({
        where: {
            id: provider_customer_id
        },
        data: {
            customer_final_balance: customer_final_balance
        }
    })
    return providerCustomerFinalBalance;
}

const createSalesInvoiceParty = async (sales_invoice_id, data) => {
    const salesInvoiceParty = await SalesInvoiceParty.create({
        data: {
            ...data,
            sales_invoice_id: sales_invoice_id
        }
    });
    return salesInvoiceParty;
}

const getSalesInvoiceTransactions = async (sales_invoice_id) => {
    const transactions = await SalesInvoiceTransactions.findMany({
        where: {
            sales_invoice_id: sales_invoice_id
        }
    });
    return transactions;
}

const createSalesCustomerVehicle = async (sales_invoice_id, data) => {
    const salesCustomerVehicle = await SalesCustomerVehicle.create({
        data: {
            sales_invoice_id,
            provider_customer_id: data.provider_customer_id,
            provider_customer_vehicle_id: data.provider_customer_vehicle_id,
            vehicle_number: data.vehicle_number,
            vehicle_type: data.vehicle_type,
            vehicle_model: data.vehicle_model,
            vehicle_color: data.vehicle_color,
            vehicle_fuel_type: data.vehicle_fuel_type,
            vehicle_transmission: data.vehicle_transmission,
            vehicle_variant: data.vehicle_variant,
            vehicle_make_year: data.vehicle_make_year,
            vehicle_mileage: data.vehicle_mileage,
            vehicle_insurance_details: data.vehicle_insurance_details,
            vehicle_engine_number: data.vehicle_engine_number,
            vehicle_chassis_number: data.vehicle_chassis_number,
            vehicle_registration_number: data.vehicle_registration_number,
            vehicle_fuel_level: data.vehicle_fuel_level,
            personal_belongings: data.personal_belongings,
            dents_images: data.dents_images,
            vehicle_images: data.vehicle_images
        }
    })
    return salesCustomerVehicle;
}


export {
    getProviderByUserId,
    getSalesInvoiceById,
    clearSalesInvoice,
    getProviderCustomerById,
    getFranchiseInventoryById,
    updateSalesInvoice,
    createSalesParts,
    createSalesServices,
    updateFranchiseInventory,
    restoreFranchiseInventory,
    createSalesInvoiceTransactions,
    createTransactions,
    updateProviderCustomerFinalBalance,
    createSalesInvoiceParty,
    getSalesInvoiceTransactions,
    createSalesCustomerVehicle
}