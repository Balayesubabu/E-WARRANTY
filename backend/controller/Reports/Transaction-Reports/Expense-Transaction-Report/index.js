import { getProviderByUserId, getExpenseCategory } from "./query.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { Category } from "../../../../prisma/db-models.js";

const getExpenseTransactionReportEndpoint =  async(req, res) => {
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
        logger.info(`user id is ${user_id}`);

        logger.info(`--- Fetching provider id from the user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${user_id} ---`);

        const {  start_date, end_date ,expense_category_id} = req.query;
        logger.info(`--- Fetching AAAAA start date ${start_date} and end date ${end_date} ---`);
        logger.info(`--- Fetching expense Transaction from the provider id ${provider.id} ---`);
        const expenses = await getExpenseCategory(provider.id, franchise_id, expense_category_id, start_date, end_date);
        if (!expenses) {
            logger.error(`--- Expense Transaction not found for provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Expense Transaction not found for provider id ${provider.id}`);
        }
        logger.info(`--- Expense Transaction found for provider id ${provider.id} ---`);
        console.log('Expenses:', expenses);
        let formattedExpenses = [];
        for(const expense of expenses){
            formattedExpenses.push({
                category : expense.category,
                expense_number : expense.expense_number,
                date : expense.created_at ? new Date(expense.created_at).toLocaleDateString('en-GB').replace(/\//g, '-') : null,
                price : expense.price,
                payment_mode : expense.payment_mode,
                transaction_id : expense.transaction_id ? expense.transaction_id : '-',

            });
        }   

        return returnResponse(res, StatusCodes.OK, `Expense Transaction fetched successfully`, formattedExpenses);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getExpenseTransactionReportEndpoint };