import { Provider  , Expenses} from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider
};


const getHighestExpenseNumberByProviderId = async (provider_id, franchise_id) => {
    const result = await Expenses.aggregate({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            is_deleted: false,
            is_active: true
        },
        _max: {
            expense_number: true
        }
    });
    return result._max.expense_number || 0;
};



export { getProviderByUserId, getHighestExpenseNumberByProviderId };