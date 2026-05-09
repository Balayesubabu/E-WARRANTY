import {
  Provider,
  ProviderCustomers,
  ProviderCustomerVehicle,
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getCustomerById = async (customer_id) => {
  const customer = await ProviderCustomers.findFirst({
    where: {
      id: customer_id,
    },
  });
  return customer;
};

const createCustomerVehicle = async (data) => {
  const customerVehicle = await ProviderCustomerVehicle.create({
    data: {
      provider_customer_id: data.provider_customer_id,
      vehicle_number: data.vehicle_number,
      vehicle_type: data.vehicle_type,
      vehicle_model: data.vehicle_model,
      vehicle_color: data.vehicle_color,
      vehicle_fuel_type: data.vehicle_fuel_type,
      vehicle_transmission: data.vehicle_transmission,
      vehicle_variant: data.vehicle_variant,
      vehicle_make_year: data.vehicle_make_year,
      vehicle_mileage: data.vehicle_mileage,
      vehicle_insurance_details: data.vehicle_insurance_details,
      vehicle_engine_number: data.vehicle_engine_number,
      vehicle_chassis_number: data.vehicle_chassis_number,
      vehicle_registration_number: data.vehicle_registration_number,
      vehicle_images: data.vehicle_images,
    },
  });
  return customerVehicle;
};

export { getProviderByUserId, getCustomerById, createCustomerVehicle };
