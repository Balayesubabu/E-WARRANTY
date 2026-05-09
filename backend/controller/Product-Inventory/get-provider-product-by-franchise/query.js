import { FranchiseInventory, Provider,Category,FranchiseInventoryTransaction,SalesInvoice,PurchaseInvoice} from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({ where: { user_id } });
    return provider;
}

const getProductsByFranchiseId = async (franchise_id, provider_id) => {
    const products = await FranchiseInventory.findMany({ 
        where: { 
            franchise_id:franchise_id, 
            provider_id:provider_id 
        }, 
        include: {
        provider: true,
        franchise: true
    },
        orderBy: { created_at: 'desc' }
 });
    return products;
}
const getCategoryName = async (provider_id,category_id) => {
    const products = await Category.findUnique({
        where: {
            provider_id: provider_id,
            id:category_id
        }
    });
    return products;
}
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
export { getProviderByUserId, getProductsByFranchiseId,getCategoryName,getStockDetailedReport,getSalesInvoiceById,getPurchaseInvoiceById};