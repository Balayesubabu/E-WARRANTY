import {
    getProviderByUserId,
    getStockDetailedReport,
    // getStockReportTabular
    getFranchiseInventoryById,
    getSalesInvoiceById,
    getPurchaseInvoiceById
} from "./query.js";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

// const getStockDetailedReportController = async (req, res) => {
//     try {
//          let user_id;
//         let staff_id;
//         if(req.type == 'staff'){
//            user_id = req.user_id;
//             staff_id = req.staff_id;
//         }
//         if(req.type == 'provider'){
//             user_id = req.user_id;
//             staff_id = null;
//         }
//         const franchise_id = req.franchise_id;


//         // console.log(req , "req");
        
//         const { franchise_inventory_id , start_date, end_date} = req.query;
//         logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
//         const provider = await getProviderByUserId(user_id);
//         const report = await getStockDetailedReport(provider.id,franchise_id, franchise_inventory_id, start_date, end_date);
//         logger.info(`--- Stock Report fetched for provider id: ${provider.id} ---`);
//         // const tabular = await getStockReportTabular(provider.id);
//         let finallyReport = [];
//         let closing_stock = 0;
//         for (let record of report) {
//             // console.log(record , "record");
//             if(record.purchase_invoice){
//                 if(record.purchase_invoice.invoice_type === "Purchase"){
//                     console.log("Purchase",record.id);
//                     console.log("Before closing stock",closing_stock);
//                     console.log("part quantity", record.part_quantity);
//                     closing_stock += record.part_quantity;
//                     console.log("closing stock",closing_stock);
//                     finallyReport.push({
//                         trasction_type : "Purchase",
//                         // date: new Date(record.purchase_invoice.created_at).toLocaleDateString('en-GB').replace(/\//g, '-'),
//                         date: record.purchase_invoice.created_at,
//                         invoice_number : record.purchase_invoice.invoice_number,
//                         quantity : record.part_quantity,
//                         closing_stock : closing_stock,
//                         unit: record.franchise_inventory.product_measuring_unit
//                     })
                    
//                 }
//                 if(record.purchase_invoice.invoice_type === "Purchase_Return"){
//                     console.log("Purchase Return",record.id);
//                     console.log("Before closing stock",closing_stock);
//                     console.log("part quantity", record.part_quantity);
//                     closing_stock -= record.part_quantity;
//                     console.log("closing stock",closing_stock);
//                     finallyReport.push({
//                         trasction_type : "Purchase_Return",
//                         // date: new Date(record.purchase_invoice.created_at).toLocaleDateString('en-GB').replace(/\//g, '-'),
//                         date: record.purchase_invoice.created_at,
//                         invoice_number : record.purchase_invoice.invoice_number,
//                         quantity : - record.part_quantity,
//                         closing_stock : closing_stock,
//                         unit: record.franchise_inventory.product_measuring_unit
//                     })
                    
//                 }
//             }
//             if(record.sales_invoice){   
//                 if(record.sales_invoice.invoice_type === "Sales"){
//                     console.log("Sales",record.id);
//                     console.log("Before closing stock",closing_stock);
//                     console.log("part quantity", record.part_quantity);
//                     closing_stock -= record.part_quantity;
//                     console.log("closing stock",closing_stock);
//                     finallyReport.push({
//                         trasction_type : "Sales",
//                         // date: new Date(record.sales_invoice.created_at).toLocaleDateString('en-GB').replace(/\//g, '-'),
//                         date: record.sales_invoice.created_at,
//                         invoice_number : record.sales_invoice.invoice_number,
//                         quantity : - record.part_quantity,
//                         closing_stock : closing_stock,
//                         unit:record.franchise_inventory.product_measuring_unit
//                     })
                    
//                 }
                
//                 if(record.sales_invoice.invoice_type === "Sales_Return"){
//                     console.log("Sales Return",record.id);
//                     console.log("Before closing stock",closing_stock);
//                     console.log("part quantity", record.part_quantity);
//                     closing_stock += record.part_quantity;
//                     console.log("closing stock",closing_stock);
//                     finallyReport.push({
//                         trasction_type : "Sales_Return",
//                         // date: new Date(record.sales_invoice.created_at).toLocaleDateString('en-GB').replace(/\//g, '-'),
//                         date: record.sales_invoice.created_at,
//                         invoice_number : record.sales_invoice.invoice_number,
//                         quantity : record.part_quantity,
//                         closing_stock : closing_stock,
//                         unit: record.franchise_inventory.product_measuring_unit
//                     })
                    
//                 }
//             }
//         }
//         return returnResponse(res, StatusCodes.OK, "Stock Report fetched successfully", finallyReport);
//     } catch (error) {
//         return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
//     }
// };

const getStockDetailedReportController = async (req, res) => {
    try {
        logger.info(`--- Stock Detailed Report controller initiated ---`);
         let user_id;
        let staff_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
            staff_id = req.staff_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
            staff_id = null;
        }
        const franchise_id = req.franchise_id;
        const { franchise_inventory_id , start_date, end_date} = req.query;
        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        const franchiseInventory = await getFranchiseInventoryById(franchise_inventory_id);
        if (!franchiseInventory) {
            return returnError(res, StatusCodes.NOT_FOUND, "Franchise Inventory not found");
        }
        const reports = await getStockDetailedReport(provider.id,franchise_id, franchise_inventory_id, start_date, end_date);
        let finallyReport = [];
        let closing_stock = 0;
        for (let record of reports) {
            if(record.sales_invoice_id){
                let salesInvoice = await getSalesInvoiceById(record.sales_invoice_id);
                if(salesInvoice.invoice_type === "Sales"){
                    closing_stock -= record.quantity;
                }
                if(salesInvoice.invoice_type === "Sales_Return"){
                    closing_stock += record.quantity;
                }
                if(salesInvoice.invoice_type === "Credit_Note"){
                    closing_stock += record.quantity;
                }
                finallyReport.push({
                    invoice_type:salesInvoice.invoice_type,
                    stock_changed_by:record.stock_changed_by,
                    date: new Date(record.created_at).toLocaleDateString('en-GB').replace(/\//g, '-'),
                    sort_date: record.created_at, // ✅ sortable
                    invoice_number : salesInvoice.invoice_number,
                    quantity : record.quantity,
                    closing_stock: closing_stock,
                    unit: franchiseInventory.product_measuring_unit,
                });

            }
            else if(record.purchase_invoice_id){
                let purchaseInvoice = await getPurchaseInvoiceById(record.purchase_invoice_id);
                if(purchaseInvoice.invoice_type === "Purchase"){
                    closing_stock += record.quantity;
                }
                if(purchaseInvoice.invoice_type === "Purchase_Return"){
                    closing_stock -= record.quantity;
                }
                if(purchaseInvoice.invoice_type === "Debit_Note"){
                    closing_stock -= record.quantity;
                }
                finallyReport.push({
                    invoice_type:purchaseInvoice.invoice_type,
                    stock_changed_by:record.stock_changed_by,
                    date: new Date(record.created_at).toLocaleDateString('en-GB').replace(/\//g, '-'),
                    sort_date: record.created_at, // ✅ sortable   
                    invoice_number : purchaseInvoice.invoice_number,
                    quantity : record.quantity,
                    closing_stock: closing_stock,
                    unit: franchiseInventory.product_measuring_unit,
                });
            }
            else{
                if(record.action === "adjustment"){
                    closing_stock += record.quantity;
                }
                if(record.action === "add"){
                    closing_stock += record.quantity;
                }
                if(record.action === "reduce"){
                    closing_stock -= record.quantity;   
                }
                finallyReport.push({
                    invoice_type:"-",
                    stock_changed_by:record.stock_changed_by,
                    date: new Date(record.created_at).toLocaleDateString('en-GB').replace(/\//g, '-'),
                    sort_date: record.created_at, // ✅ sortable
                    invoice_number : "-",
                    quantity : record.quantity,
                    closing_stock: closing_stock,
                    unit: franchiseInventory.product_measuring_unit,
                });
            }
        }
        finallyReport.sort((a, b) => b.sort_date - a.sort_date);
        finallyReport = finallyReport.map(({ sort_date, ...rest }) => rest);
        logger.info(`--- Stock Report fetched for provider id: ${provider.id} ---`);
        return returnResponse(res, StatusCodes.OK, "Stock Report fetched successfully", finallyReport);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }   
};


export { getStockDetailedReportController };