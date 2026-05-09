import { Provider  , Expenses} from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider
};


const getExpensesByProviderId = async (provider_id, franchise_id) => {
    const expenses = await Expenses.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            is_deleted: false,
            is_active: true
        },
    });
    return expenses;
};

export { getProviderByUserId, getExpensesByProviderId };