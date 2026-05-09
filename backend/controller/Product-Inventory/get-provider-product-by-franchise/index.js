import { getProviderByUserId, getProductsByFranchiseId,getCategoryName,getStockDetailedReport,getSalesInvoiceById,getPurchaseInvoiceById } from "./query.js";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getProviderProductByFranchise = async (req, res) => {
    try {
        logger.info(`getProviderProductByFranchise`);
        const { franchise_id } = req.params;
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

        logger.info(`--- Fetching provider with user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with user_id: ${user_id} ---`);

        logger.info(`--- Fetching products with franchise_id: ${franchise_id} ---`);
        const products = await getProductsByFranchiseId(franchise_id, provider.id);
        if (!products) {
            logger.error(`--- Products not found with franchise_id: ${franchise_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Products not found`);
        }
        logger.info(`--- Products found with franchise_id: ${franchise_id} ---`);
        console.log(products);

        logger.error(`--- category name with provider id ${provider.id} ---`);
        const updatedProducts = await Promise.all(
            products.map(async (prd) => {
              if (prd.category_id) {
                const categoryName = await getCategoryName(provider.id, prd.category_id);
                console.log(categoryName);
                if(categoryName){
                prd.categoryName = categoryName.category_name;
                }
                else{
                    prd.categoryName = '';
                }
              } else {
                prd.categoryName = '';
              }
              if(prd.id){
                const reports = await getStockDetailedReport(provider.id,franchise_id, prd.id);
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
                    }
                } 
                prd.product_quantity = closing_stock;
              }
              return prd;
            })
          );

        logger.info(`--- Products with category name fetched successfully ---`);

        logger.info(`--- Returning products ---`);
        
        return returnResponse(res, StatusCodes.OK, `Products fetched successfully`, updatedProducts);
    }
    catch (error) {
        logger.error(`Error in getProviderProductByFranchise: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getProviderProductByFranchise`);
    }
}

export { getProviderProductByFranchise };