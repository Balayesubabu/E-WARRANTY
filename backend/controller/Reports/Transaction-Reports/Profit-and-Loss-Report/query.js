import { Provider, SalesInvoice, PurchaseInvoice, Expenses,FranchiseInventory, FranchiseInventoryTransaction } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getProfitAndLossReportByProviderId = async (provider_id, franchise_id, start_date, end_date) => {
    const baseWhereClause = {
        provider_id: provider_id,
        franchise_id: franchise_id,
        invoice_date: {
            gte: new Date(start_date),
            lte: new Date(end_date)
        },
        is_deleted: false
    };


    const salesWhereClause = { ...baseWhereClause };
    const purchaseWhereClause = { ...baseWhereClause };

    // Fetch Sales Invoices
    const sales_invoices = await SalesInvoice.findMany({
        where: salesWhereClause,
        include: {
            // provider_customer: {
            //     select: {
            //         customer_name: true,
            //         customer_phone: true,
            //         customer_email: true
            //     }
            // },
            SalesInvoiceTransactions: {
                select: {
                    transaction_type: true,
                    transaction_status: true,
                    amount: true,
                    created_at: true
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    // Fetch Purchase Invoices
    const purchase_invoices = await PurchaseInvoice.findMany({
        where: purchaseWhereClause,
        include: {
            // provider_customer: {
            //     select: {
            //         customer_name: true,
            //         customer_phone: true,
            //         customer_email: true
            //     }
            // },
            PurchaseInvoiceTransactions: {
                select: {
                    transaction_type: true,
                    transaction_status: true,
                    amount: true,
                    created_at: true
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    const expenses = await Expenses.findMany({
        where: {
            provider_id: provider_id,
            created_at: {
                gte: new Date(start_date),
                lte: new Date(end_date)
            },
            
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    return { sales_invoices, purchase_invoices, expenses };
}

const getProductsByFranchiseId = async (provider_id,franchise_id) => {
    const products = await FranchiseInventory.findMany({ 
        where: { 
            franchise_id:franchise_id, 
            provider_id:provider_id 
        }, 
        orderBy: { created_at: 'desc' }
 });
    return products;
};

const getStockDetailedReport = async (provider_id, franchise_id, franchise_inventory_id) => {
    const allTransactions = await FranchiseInventoryTransaction.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            franchise_inventory_id: franchise_inventory_id
        },
    });

    allTransactions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return allTransactions;
};

const getSalesInvoiceById = async (sales_invoice_id) => {
    const salesInvoice = await SalesInvoice.findFirst({
        where: { id: sales_invoice_id },
    });
    return salesInvoice;
};
const getPurchaseInvoiceById = async (purchase_invoice_id) => {
    const purchaseInvoice = await PurchaseInvoice.findFirst({
        where: { id: purchase_invoice_id },
    });
    return purchaseInvoice;
};



export { getProviderByUserId, getProfitAndLossReportByProviderId,getProductsByFranchiseId,getStockDetailedReport,getSalesInvoiceById,getPurchaseInvoiceById};