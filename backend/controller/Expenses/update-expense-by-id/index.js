import { getProviderByUserId, getExpensesById , checkExpenseCategory} from "./query.js";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { Expenses } from "../../../prisma/db-models.js";

const updateExpenseByIdEndpoint = async (req, res) => {
  try {
    logger.info(`updateExpenseByIdEndpoint`);
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
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Provider not found with user id ${req.user_id}`
      );
    }
    logger.info(`--- Provider found with user id ${user_id} ---`);

    const { id } = req.params;
    logger.info(`--- Fetching expense by id ${id} ---`);

    logger.info(`--- Fetching expense from the provider id ${provider.id} ---`);
    const existing_expense = await getExpensesById(id, provider.id, franchise_id);
    if (!existing_expense) {
      logger.error(`--- Expense not found with provider id ${provider.id} ---`);
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Expense not found with provider id ${provider.id}`
      );
    }
    logger.info(`--- Expense found with provider id ${provider.id} ---`);

    const data = req.body;

    let { 
      category, 
      price ,
      expense_number,
      expense_category_id,
       payment_mode
      } = data;
if (!category || !price) {
  logger.error(`--- category or price not found ---`);
  return res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    error: 'category or price not found'
  });
}
 logger.info(`--- Fetching expense_category by id ${expense_category_id} ---`);
        const expense_category = await checkExpenseCategory(provider.id, franchise_id, expense_category_id );
        if (!expense_category) {
            logger.error(`--- expense_category not found with id ${expense_category_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `expense_category not found with id ${expense_category_id}`);
        }
        logger.info(`--- expense_category found with id ${expense_category_id} ---`);

        logger.info(`check whwther the category name and the expensecatgeory id are matching or not`);
        if (category !== expense_category.category) {
            logger.error(`--- category name and the expensecatgeory id are not matching ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `category name and the expensecatgeory id are not matching`);
        }
    logger.info(`--- Updating expense ---`);
    const updated_expense = await Expenses.update({
      where: { id: id },
      data: {
         category: category || existing_expense.category,
         expense_number:expense_number || existing_expense.expense_number,
          payment_mode: payment_mode || existing_expense.payment_mode,
          price: price  || existing_expense.price,
          expense_category_id: expense_category_id || existing_expense.expense_category_id
        },
    });
    logger.info(`--- Expense updated ---`);

    return returnResponse(
      res,
      StatusCodes.OK,
      `Expense updated successfully`,
      updated_expense
    );
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
  }
};


export { updateExpenseByIdEndpoint };