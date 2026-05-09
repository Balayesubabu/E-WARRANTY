import {Provider , ExpenseCategory} from "../../../prisma/db-models.js"

const getProviderByUserId = async(user_id) => {
    const provider = await Provider.findFirst({
        where : {
            user_id : user_id
        }
    })
    return provider;
}

const getAllExpenseCategory = async(provider_id, franchise_id) => {
    const expense_category = await ExpenseCategory.findMany({
        where : {
            provider_id : provider_id,
            franchise_id : franchise_id,
            is_deleted : false,
            is_active : true
        }
    })
    return expense_category;
}

export {getProviderByUserId ,  getAllExpenseCategory};