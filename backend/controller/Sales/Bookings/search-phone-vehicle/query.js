import {Provider, ProviderCustomers, ProviderCustomerVehicle} from '../../../../prisma/db-models.js';

const getProviderByUserId = async (userId) => {
  return await Provider.findFirst({
    where: {
        user_id: userId
    }
  });
}

const searchPhoneVehicle = async (value, ProviderId) => {
    const results = await ProviderCustomers.findMany({
        where: {
            provider_id: ProviderId,
        },
        include: { ProviderCustomerVehicle: true }
    });
    const filteredResults = results.filter(customer => 
        customer.customer_phone.includes(value) ||
        customer.ProviderCustomerVehicle.some(vehicle => vehicle.vehicle_number.includes(value))
    );
    return filteredResults;
};


export { getProviderByUserId, searchPhoneVehicle };

