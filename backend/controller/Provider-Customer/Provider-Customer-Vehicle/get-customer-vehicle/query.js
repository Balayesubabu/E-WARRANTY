import { Provider, ProviderCustomers } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getCustomerById = async (customer_id) => {
    const customer = await ProviderCustomers.findFirst({
        where: {
            id: customer_id
        },
        include: {
            ProviderCustomerVehicle: true
        }
    })
    return customer;
}

export { getProviderByUserId, getCustomerById };