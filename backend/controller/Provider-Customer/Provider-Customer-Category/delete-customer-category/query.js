import { Provider, CustomerCategory } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const deleteCustomerCategory = async (customer_category_id) => {
    const customer_category = await CustomerCategory.delete({
        where: {
            id: customer_category_id
        }
    })
    return customer_category;
}

export { getProviderByUserId, deleteCustomerCategory };