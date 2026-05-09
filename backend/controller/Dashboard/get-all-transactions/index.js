import { getProviderByUserId, getAllTransactions,getInvoiceIdLinkedSalesInvoice,getInvoiceIdLinkedPurchaseInvoice,getExpenses } from "./query.js";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getAllTransactionsEndPoint = async (req, res) => {
  try {
    logger.info(`get user id`);
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
    let startDate = req.params.startDate;
    let endDate = req.params.endDate;
    console.log(startDate,endDate);
    logger.info(`user id is ${user_id}`);

    logger.info(`--- Fetching provider id from the user id ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found with user id ${user_id} ---`);
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Provider not found with user id ${req.user_id}`
      );
    }
    logger.info(`--- Provider found with user id ${user_id} ---`);

    logger.info(
      `--- Fetching transactions from the provider id ${provider.id} ---`
    );
    let transactions = await getAllTransactions(provider.id,franchise_id,startDate,endDate);
    if(!transactions || transactions.length === 0){
        logger.error(
          `---transactions not found with provider id ${provider.id} ---`
        );
        return returnResponse(
          res,
          StatusCodes.OK,
          `transactions not found with provider id ${provider.id}`,
          transactions
        );
    }
    let updatedTransactions = [...transactions];
    for (let i=0;i<transactions.length;i++){
        if(transactions[i].SalesInvoiceTransactions){
          const getInvoiceTransaction = transactions[i].SalesInvoiceTransactions;
          for(let j=0;j<getInvoiceTransaction.length;j++){
            getInvoiceTransaction[j].provider_customer = transactions[i].provider_customer;
            updatedTransactions.push(getInvoiceTransaction[j]);
          }
          }
          if(transactions[i].PurchaseInvoiceTransactions){
            const getPurchaseInvoiceTransaction = transactions[i].PurchaseInvoiceTransactions;
            for(let k=0;k<getPurchaseInvoiceTransaction.length;k++){
              getPurchaseInvoiceTransaction[k].provider_customer = transactions[i].provider_customer;
              updatedTransactions.push(getPurchaseInvoiceTransaction[k]);
            }
          }
          if(transactions[i].invoice_type === "Sales"){
            const result = await getInvoiceIdLinkedSalesInvoice(transactions[i].id);
            if(!result){
              transactions[i].is_linked = false;
              transactions[i].linked_invoice_total_amount = 0;
              transactions[i].updated_pending_amount = transactions[i].invoice_pending_amount;
              if(transactions[i].invoice_pending_amount < 0){
                transactions[i].updated_pending_amount = 0;
              }
            }
            else{
              transactions[i].is_linked = true;
              transactions[i].linked_invoice_total_amount = result.invoice_total_amount;
              transactions[i].updated_pending_amount = transactions[i].invoice_pending_amount - result.invoice_total_amount;
              if(transactions[i].updated_pending_amount < 0){
                transactions[i].updated_pending_amount = 0;
              }
            }   
        }
        if(transactions[i].invoice_type === "Purchase"){
          const result = await getInvoiceIdLinkedPurchaseInvoice(transactions[i].id);
          if(!result){
            transactions[i].is_linked = false;
            transactions[i].linked_invoice_total_amount = 0;
            transactions[i].updated_pending_amount = transactions[i].invoice_pending_amount;
            if(transactions[i].invoice_pending_amount < 0){
              transactions[i].updated_pending_amount = 0;
            }
          }
          else{
            transactions[i].is_linked = true;
            transactions[i].linked_invoice_total_amount = result.invoice_total_amount;
            transactions[i].updated_pending_amount = transactions[i].invoice_pending_amount - result.invoice_total_amount;
            if(transactions[i].updated_pending_amount < 0){
              transactions[i].updated_pending_amount = 0;
            }
          }
      }
    }
    const getAllExpenses = await getExpenses(provider.id,franchise_id,startDate,endDate);
    updatedTransactions = [...updatedTransactions,...getAllExpenses];
    transactions = updatedTransactions;
    transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return returnResponse(
      res,
      StatusCodes.OK,
      `transactions fetched successfully`,
      transactions
    );
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getAllTransactionsEndPoint };
