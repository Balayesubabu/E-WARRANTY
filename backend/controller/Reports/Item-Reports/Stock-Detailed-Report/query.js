import { all } from "axios";
import { Provider, FranchiseInventory, FranchiseInventoryTransaction, PurchaseInvoice, SalesInvoice, SalesPart, PurchasePart } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider;
};

const parseDate = (dateStr, isEndDate = false) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  // If only YYYY-MM-DD, normalize to UTC start/end of day
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    if (isEndDate) {
      utcDate.setUTCHours(23, 59, 59, 999);
    } else {
      utcDate.setUTCHours(0, 0, 0, 0);
    }
    return utcDate;
  }

  return date; // already ISO string
};


// const getStockDetailedReport = async (provider_id, franchise_id, franchise_inventory_id , start_date, end_date) => {
//     let whereClause = {
//         provider_id: provider_id,
//         franchise_id: franchise_id,
//         franchise_inventory_id: franchise_inventory_id,
//     };
    
//     if (start_date && end_date) {
//         console.log("start_date", start_date);
//         console.log("end_date", end_date);
//         whereClause.created_at = {
//             gte: parseDate(start_date),
//             lte: parseDate(end_date),
//         };
//     }
//    const stock_detailed_report = await FranchiseInventoryTransaction.findMany({
//     where: whereClause,
//     include: {
//         franchise_inventory: {
//             select: {
//                 product_name: true,
//                 product_item_code: true,
//             },
//         }
//     }, 
//      orderBy: { created_at: 'desc' },
//    });
//    for (let record of stock_detailed_report) {
//        if(record.purchase_invoice_id){
//            const purchaseInvoice = await PurchaseInvoice.findFirst({
//                where: { id: record.purchase_invoice_id },
//            });
//            record.purchaseInvoice = purchaseInvoice;
//        }
//          if(record.sales_invoice_id){
//               const salesInvoice = await SalesInvoice.findFirst({
//                     where: { id: record.sales_invoice_id },
//                 });
//                 record.salesInvoice = salesInvoice;
//          }
//     }
//     return stock_detailed_report;
// }   

// const getStockDetailedReport = async (provider_id, franchise_id, franchise_inventory_id , start_date, end_date) => {
//      let startDateFilter = new Date(start_date);
//     let endDateFilter = new Date(end_date);

//     const sales_report = await SalesPart.findMany({
//         where: {
//             franchise_inventory_id: franchise_inventory_id,
//             sales_invoice: {
//                 provider_id: provider_id,
//                 franchise_id: franchise_id,
//                 created_at: {
//                     gte: startDateFilter,
//                     lte: endDateFilter,
//                 },
//                 invoice_type: {"notIn":["Quotation","Delivery_Challan","Proforma_Invoice","Credit_Note"]},
//                 invoice_status: {"notIn":["Cancelled"]}
//             },
//         },
//         include: {
//             sales_invoice: true,
//             franchise_inventory: true
//         },
//         // orderBy:{sales_invoice:{created_at:'asc'}}
//     });
//     const purchase_report = await PurchasePart.findMany({
//         where: {
//             franchise_inventory_id: franchise_inventory_id,
//             purchase_invoice: {
//                 provider_id: provider_id,
//                 franchise_id: franchise_id,
//                 created_at: {
//                     gte: startDateFilter,
//                     lte: endDateFilter,
//                 },
//                invoice_type: {"notIn":["Purchase_Order","Debit_Note"]},
//                invoice_status: {"notIn":["Cancelled"]}
//             },
//         },
//         include: {
//             purchase_invoice: true,
//             franchise_inventory: true
//         },
//         // orderBy:{purchase_invoice:{created_at:'asc'}}
//     });

//     const sales_purchase_report = [...sales_report, ...purchase_report];
//     // Sort by created_at descending
//     sales_purchase_report.sort((a, b) => {
//         const dateA = a.sales_invoice?.created_at || a.purchase_invoice?.created_at;
//         const dateB = b.sales_invoice?.created_at || b.purchase_invoice?.created_at;

//         return new Date(dateA) - new Date(dateB); // desc order
//     });
//     console.log(sales_purchase_report);
//     return sales_purchase_report;
// };

const  getFranchiseInventoryById = async (franchise_inventory_id) => {
    const franchiseInventory = await FranchiseInventory.findFirst({
        where: { id: franchise_inventory_id },
    });
    return franchiseInventory;
}

const getStockDetailedReport = async (provider_id, franchise_id, franchise_inventory_id , start_date, end_date) => {
     let startDateFilter = parseDate(start_date);
    let endDateFilter = parseDate(end_date, true);
    const allTransactions = await FranchiseInventoryTransaction.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            franchise_inventory_id: franchise_inventory_id,
            created_at: {
                gte: startDateFilter,
                lte: endDateFilter,
            },
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

export { getProviderByUserId, getStockDetailedReport,getFranchiseInventoryById, getSalesInvoiceById, getPurchaseInvoiceById};