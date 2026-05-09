import  {getProviderByUserId ,  getExpenseCategoryById} from './query.js'      
import {logger, returnError, returnResponse} from '../../../services/logger.js'
import {StatusCodes} from 'http-status-codes'
import { ExpenseCategory } from '../../../prisma/db-models.js';

const updateExpenseCategoryByIdEndpoint = async (req, res) => {
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

        const {id} = req.params;
        logger.info(`--- Fetching expense_category by id ${id} ---`);
        logger.info(`--- Fetching expense_category from the provider id ${provider.id} ---`);
        const existing_expense_category = await getExpenseCategoryById(provider.id, franchise_id, id);
        if (!existing_expense_category) {
            logger.error(`---expense_category not found with provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `expense_category not found with provider id ${provider.id}`);
        }
        logger.info(`--- expense_category found with provider id ${provider.id} ---`);

        const data = req.body;

        const {category} =  data;

        if(!category) {
            logger.error(`--- category cannot be empty ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `category not found`);
        }

        const updated_expense_category = await ExpenseCategory.update({
            where : {
                id : id,
                provider_id : provider.id,
                franchise_id : franchise_id
            }
            , data : {
                category : category || existing_expense_category.category
            }
        })
        return returnResponse(res, StatusCodes.OK, `expense_category updated successfully`, updated_expense_category);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export  {updateExpenseCategoryByIdEndpoint}