import  {getProviderByUserId ,  checkExpenseCategory} from './query.js'
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { Expenses } from '../../../prisma/db-models.js';


const createExpenseEndpoint = async (req, res) => {
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
        logger.info(`--- Provider${provider.id} found with user id ${user_id} ---`);

        logger.info(`getting req.body`);
        const data = req.body;

        let {
            category,
            expense_number,
            expense_category_id,
            payment_mode,
            transaction_id,
            price
        } = data;

      logger.info(`--- Checking if category or price not found ---`);
        if(!category || !price) {
            logger.error(`--- category or price not found ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `category or price not found`);
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
        logger.info(`--- Creating expense ---`);
        const expense = await Expenses.create({
            data: {
                category: category,
                expense_number:expense_number,
                expense_category_id: expense_category_id,
                payment_mode: payment_mode,
                transaction_id: transaction_id,
                price: price,
                provider_id: provider.id,
                franchise_id: franchise_id,
                created_by: provider.id || staff_id,
                created_at: new Date(),
            }
        });

        logger.info(`--- Expense created successfully ---`);
        return returnResponse(res, StatusCodes.OK, `Expense created successfully`, expense);

    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { createExpenseEndpoint }