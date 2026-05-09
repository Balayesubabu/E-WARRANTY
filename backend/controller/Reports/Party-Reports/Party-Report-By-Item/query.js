import { Provider, ProviderCustomers } from "../../../../prisma/db-models.js";
import { logger } from "../../../../services/logger.js";
import { parseDate } from "../../../../services/parse-date.js";

const getProviderByUserId = async (user_id) => {

    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}



const getPurchaseAndSalesByCustomers = async (provider_id, franchise_id, franchise_inventory_id, start_date, end_date) => {
    const whereClausePurchaseParts = {}
    const whereClauseSalesParts = {}

    if (franchise_inventory_id) {
        whereClausePurchaseParts.franchise_inventory_id = franchise_inventory_id;
        whereClauseSalesParts.franchise_inventory_id = franchise_inventory_id;
    }
    const today = new Date()
    let startDateFilter, endDateFilter

    if (!start_date && !end_date) {
        startDateFilter = parseDate(today)
        startDateFilter.setDate(startDateFilter.getDate() - 30)
        endDateFilter = parseDate(today)
    }
    else if (start_date && !end_date) {
        startDateFilter = parseDate(start_date)
        endDateFilter = parseDate(today, true)
    }
    else if (!start_date && end_date) {
        startDateFilter = new Date('1970-01-01');
        endDateFilter = parseDate(end_date, true)
    }
    else {
        startDateFilter = parseDate(start_date);
        endDateFilter = parseDate(end_date, true);
    }
    // Option 1: Using only SELECT (more specific, smaller payload)
    const purchaseAndSalesDetails = await ProviderCustomers.findMany({
        where: {
            provider_id: provider_id
        },
        select: {
            customer_name: true,
            PurchaseInvoice: {
                where: {
                    provider_id: provider_id,
                    franchise_id: franchise_id,
                    invoice_type: "Purchase",
                    created_at: {
                        gte: startDateFilter,
                        lte: endDateFilter
                    }
                },
                select: {
                    id: true,
                    PurchasePart: {
                        where: whereClausePurchaseParts,
                        select: {
                            id: true,
                            franchise_inventory_id: true,
                            part_name: true,
                            part_quantity: true,
                            part_total_price: true,

                            // Add other fields you need
                        }
                    }
                }
            },
            SalesInvoice: {
                where: {
                    provider_id: provider_id,
                    franchise_id: franchise_id,
                    invoice_type: "Sales",
                    created_at: {
                        gte: startDateFilter,
                        lte: endDateFilter
                    }
                },
                select: {
                    id: true,
                    SalesPart: {
                        where: whereClauseSalesParts,
                        select: {
                            franchise_inventory_id: true,
                            part_name: true,
                            part_quantity: true,
                            part_total_price: true

                        }
                    }
                }
            }
        }
    });

    return purchaseAndSalesDetails;
}


export { getProviderByUserId, getPurchaseAndSalesByCustomers }