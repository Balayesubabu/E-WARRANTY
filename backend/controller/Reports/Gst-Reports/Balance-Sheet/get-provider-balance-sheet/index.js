import {
  logger,
  returnError,
  returnResponse,
} from "../../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderBalanceSheet,getSalesTotalTransactions,getPurchaseTotalTransactions,getExpensesTotal,getStockTotal,getInvoiceIdLinkedPurchaseInvoice} from "./query.js";

const getProviderBalanceSheetEndpoint = async (req, res) => {
  try {
    logger.info(`getProviderBalanceSheetEndpoint`);

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
        let franchise_id = req.franchise_id;

    logger.info(`--- Fetching provider by user id : ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.info(`--- Provider not found for user id : ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }
    logger.info(`--- Provider found with user id : ${user_id} ---`);

    const balance_sheet = await getProviderBalanceSheet(provider.id, franchise_id);
    // if (balance_sheet.length === 0) {
    //   logger.info(
    //     `--- Balance sheet not found for provider id : ${provider.id} ---`
    //   );
    //   return returnResponse(res, StatusCodes.OK, "Balance sheet not found", []);
    // }
    const BALANCE_TYPES = [
      { type: "Capital", name: "Capital" },
      { type: "Tax_Payable", name: "Tax Payable" },
      { type: "Loans", name: "Loans" },
      { type: "Tax_Receivable", name: "Tax Receivable" },
      { type: "Fixed_Assets", name: "Fixed Assets" },
      { type: "Investments", name: "Investments" },
      { type: "Loans_Advance", name: "Loans & Advance" },
    ];

    /* --------------------------------------------------
       2. Initialize totals map with 0
    -------------------------------------------------- */
    const totalsMap = {
      Capital: 0,
      Tax_Payable: 0,
      Loans: 0,
      Tax_Receivable: 0,
      Fixed_Assets: 0,
      Investments: 0,
      Loans_Advance: 0,
    };

    const totalsMap1 = {
      Capital:null,
      Tax_Payable: null,
      Loans: null,
      Tax_Receivable: null,
      Fixed_Assets: null,
      Investments: null,
      Loans_Advance: null,
    };

    const totalsList ={
      Capital: [],
      Tax_Payable: [],
      Loans: [],  
      Tax_Receivable: [],
      Fixed_Assets: [],
      Investments: [],
      Loans_Advance: [],
    }



    /* --------------------------------------------------
       3. Accumulate DB values
    -------------------------------------------------- */
    for (const entry of balance_sheet) {
      if (totalsMap.hasOwnProperty(entry.type)) {
        totalsMap[entry.type] += Number(entry.amount || 0);
        totalsMap1[entry.type] = entry.id || null;
        totalsList[entry.type].push(entry);
      }
    }

    /* --------------------------------------------------
       4. Build final report (missing ones become 0)
    -------------------------------------------------- */
    let finallyReport = BALANCE_TYPES.map(item => ({
      type: item.type,
      name: item.name,
      amount: Number(totalsMap[item.type].toFixed(2)),
      id: totalsMap1[item.type],
      entries: totalsList[item.type]
    }));

    /* --------------------------------------------------
       5. Calculate Net Income
    -------------------------------------------------- */
    const totalSales = await getSalesTotalTransactions(
      provider.id,
      franchise_id
    );
    const totalPurchases = await getPurchaseTotalTransactions(
      provider.id,
      franchise_id
    );
    const totalExpenses = await getExpensesTotal(
      provider.id,
      franchise_id
    );

    const totalStock = await getStockTotal(
      provider.id,
      franchise_id
    );

    for (let i = 0; i < totalPurchases.length; i++) {
      const purchase_invoice = totalPurchases[i].id;
      const result = await getInvoiceIdLinkedPurchaseInvoice(purchase_invoice);
      if(!result){
        totalPurchases[i].is_linked = false;
        totalPurchases[i].linked_invoice_total_amount = totalPurchases[i].invoice_total_amount;
        totalPurchases[i].linked_invoice_paid_amount = totalPurchases[i].invoice_paid_amount;
        totalPurchases[i].linked_invoice_pending_amount = totalPurchases[i].invoice_pending_amount;
        
      }
        else{   
        totalPurchases[i].is_linked = true;
        totalPurchases[i].linked_invoice_total_amount = totalPurchases[i].invoice_total_amount;
        totalPurchases[i].linked_invoice_paid_amount = totalPurchases[i].invoice_paid_amount + result.invoice_total_amount;
        totalPurchases[i].linked_invoice_pending_amount = totalPurchases[i].invoice_total_amount - (result.invoice_total_amount + totalPurchases[i].invoice_paid_amount);
      }
    }

    const current_liability = totalPurchases.reduce(
      (acc, invoice) => acc + invoice.linked_invoice_pending_amount,
      0
    );

    const totalSalesAmount = totalSales.reduce(
      (sum, item) => sum + Number(item.invoice_total_amount || 0),
      0
    );

    const totalPurchaseAmount = totalPurchases.reduce(
      (sum, item) => sum + Number(item.invoice_total_amount || 0),
      0
    );

    const totalExpensesAmount = totalExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const totalStockAmount = totalStock.reduce(
      (sum, item) => sum + Number(item.product_purchase_price * item.product_quantity || 0),
      0
    );
    const netIncome =
      totalSalesAmount - totalPurchaseAmount - totalExpensesAmount;

    finallyReport.push({
      type: "Current_Liability",
      name: "Current Liability",
      amount: Number(current_liability.toFixed(2)),
    });

    finallyReport.push({
      type: "Net_Income",
      name: "Net Income",
      amount: Number(netIncome.toFixed(2)),
    });

    /* --------------------------------------------------
       6. Calculate Total Liabilities
    -------------------------------------------------- */
    const totalLiabilities =
      totalsMap.Capital +
      totalsMap.Tax_Payable +
      totalsMap.Loans +
      current_liability;

    finallyReport.push({
      type: "Total_Liabilities",
      name: "Total Liabilities",
      amount: Number(totalLiabilities.toFixed(2)),
    });

    let AssetsTotal = totalStockAmount + (totalSalesAmount - totalPurchaseAmount);
    finallyReport.push({
      type: "Current_Assets",
      name: "Current Assets",
      amount: Number(AssetsTotal.toFixed(2)),
    });
    let totalAssets = AssetsTotal + totalsMap.Tax_Receivable + totalsMap.Fixed_Assets + totalsMap.Investments + totalsMap.Loans_Advance;
    finallyReport.push({
      type: "Total_Assets",
      name: "Total Assets",
      amount: Number(totalAssets.toFixed(2)),
    });

    logger.info(
      `--- Balance sheet fetched for provider id : ${provider.id} ---`
    );

    return returnResponse(
      res,
      StatusCodes.OK,
      "Balance sheet fetched successfully",
      finallyReport
    );
  } catch (error) {
    logger.error(`Error in getProviderBalanceSheetEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Internal server error"
    );
  }
};

export { getProviderBalanceSheetEndpoint };
