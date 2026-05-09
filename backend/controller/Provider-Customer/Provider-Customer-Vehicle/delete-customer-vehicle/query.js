import { Provider, ProviderCustomerVehicle } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const deleteCustomerVehicle = async (customer_vehicle_id) => {
    const deletedCustomerVehicle = await ProviderCustomerVehicle.delete({
        where: {
            id: customer_vehicle_id
        }
    })
    return deletedCustomerVehicle;
}
export { getProviderByUserId, deleteCustomerVehicle };