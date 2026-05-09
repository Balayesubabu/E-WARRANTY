import {Provider , ExpenseCategory} from "../../../prisma/db-models.js"

const getProviderByUserId = async(user_id) => {
    const provider = await Provider.findFirst({
        where : {
            user_id : user_id
        }
    })
    return provider;
}

const getExpenseCategoryById = async(provider_id, franchise_id, id) => {
    const expense_category = await ExpenseCategory.findUnique({
        where : {
            provider_id : provider_id,
            franchise_id : franchise_id,
            id : id
        }
    })
    return expense_category;
}

const deleteExpenseCategoryById = async(provider_id, franchise_id, id) => {
    const expense_category = await ExpenseCategory.update({
        where : {
            provider_id : provider_id,
            franchise_id : franchise_id,
            id : id
        },
        data : {
            is_deleted : true,
            is_active : false
        }
    })
    return expense_category;
}

export {getProviderByUserId ,  getExpenseCategoryById ,  deleteExpenseCategoryById};