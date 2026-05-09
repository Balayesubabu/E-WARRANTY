import { Provider  , Expenses ,  ExpenseCategory} from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider
};


const getExpensesById = async (id,provider_id, franchise_id) => {
    const expense = await Expenses.findFirst({
        where: {
            id : id,
            provider_id: provider_id,
            franchise_id: franchise_id
        },
    });
    return expense
};

const checkExpenseCategory = async (provider_id, franchise_id, expense_category_id) => {
    const expense_category = await ExpenseCategory.findFirst({
        where: {
            id :expense_category_id,
            provider_id: provider_id,
            franchise_id: franchise_id
           
            }
    })
    return expense_category;
}

export { getProviderByUserId, getExpensesById , checkExpenseCategory};