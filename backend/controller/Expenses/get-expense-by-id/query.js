import { Provider  , Expenses} from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider
};


const getExpensesById = async (id,provider_id, franchise_id) => {
    const expense = await Expenses.findUnique({
        where: {
            id : id,
            provider_id: provider_id,
            franchise_id: franchise_id,
            is_deleted: false,
            is_active: true
        },
    });
    return expense
};

export { getProviderByUserId, getExpensesById };