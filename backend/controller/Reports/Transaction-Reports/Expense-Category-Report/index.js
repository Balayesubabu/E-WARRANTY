import { getProviderByUserId, getExpenseCategory } from "./query.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getExpenseCategoryReportEndpoint =  async(req, res) => {
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

        const {  start_date, end_date } = req.query;
        logger.info(`--- Fetching AAAAA start date ${start_date} and end date ${end_date} ---`);
        logger.info(`--- Fetching expense Transaction from the provider id ${provider.id} ---`);
        const expenses = await getExpenseCategory(provider.id, franchise_id, start_date, end_date);
        if (!expenses) {
            logger.error(`--- Expense Transaction not found for provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Expense Transaction not found for provider id ${provider.id}`);
        }
        logger.info(`--- Expense Transaction found for provider id ${provider.id} ---`);

       const formattedExpenses = expenses.map((expense) => {
      const expense_category = expense.category;
      
      // Calculate total price by summing all expenses in this category
      const total_price = expense.Expenses.reduce((sum, exp) => {
        return sum + (parseFloat(exp.price) || 0);
      }, 0);
      
      // Count of expenses in this category
      const expense_count = expense.Expenses.length;

      return {
        // category_id: expense.id,
        category_name: expense_category,
        total_price: total_price,
        expense_count: expense_count,
        // created_at: new Date(expense.created_at).toLocaleDateString('en-GB').replace(/\//g, '-')
      };
    });

        return returnResponse(res, StatusCodes.OK, `Expense Transaction fetched successfully`, formattedExpenses);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getExpenseCategoryReportEndpoint };