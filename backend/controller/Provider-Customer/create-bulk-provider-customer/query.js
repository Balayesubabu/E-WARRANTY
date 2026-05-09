import { Provider, ProviderCustomers } from "../../../prisma/db-models.js";

// ✅ Fetch provider by user_id
const getProviderByUserId = async (user_id) => {
  try {
    return await Provider.findFirst({
      where: { user_id },
    });
  } catch (err) {
    console.error("❌ Prisma Error in getProviderByUserId:", err);
    throw err;
  }
};

// ✅ Create single provider customer
const createProviderCustomer = async (data, provider_id) => {
  try {
    const providerCustomer = await ProviderCustomers.create({
      data: {
        provider_id,
        customer_name: data.customer_name,
        customer_email: data.customer_email || "",
        customer_country_code: data.customer_country_code || null,
        customer_phone: data.customer_phone || null,
        customer_address: data.customer_address || "",
        customer_billing_address: data.customer_billing_address || null,
        customer_shipping_address: data.customer_shipping_address || null,
        customer_city: data.customer_city || null,
        customer_state: data.customer_state || null,
        customer_country: data.customer_country || null,
        customer_pincode: data.customer_pincode || null,
        customer_pan_number: data.customer_pan_number || null,
        customer_gstin_number: data.customer_gstin_number || null,
        customer_type: data.customer_type || null,
        customer_category_id: data.customer_category_id || null,

        // ✅ Convert number fields properly
        opening_balance:
          data.opening_balance !== undefined ? Number(data.opening_balance) : 0,
        customer_credit_limit:
          data.customer_credit_limit !== undefined
            ? Number(data.customer_credit_limit)
            : 0,
        customer_credit_period:
          data.customer_credit_period !== undefined
            ? Number(data.customer_credit_period)
            : 0,
        customer_final_balance:
          data.customer_final_balance !== undefined
            ? Number(data.customer_final_balance)
            : 0,
      },
    });

    return providerCustomer;
  } catch (err) {
    console.error("❌ Prisma Error in createProviderCustomer:", err);
    throw err;
  }
};

// ✅ Create multiple provider customers in bulk
const createBulkProviderCustomers = async (dataArray, provider_id) => {
  try {
    const providerCustomers = await ProviderCustomers.createMany({
      data: dataArray.map((data) => ({
        provider_id,
        customer_name: data.customer_name,
        customer_email: data.customer_email || "",
        customer_country_code: data.customer_country_code || null,
        customer_phone: data.customer_phone || null,
        customer_address: data.customer_address || "",
        customer_billing_address: data.customer_billing_address || null,
        customer_shipping_address: data.customer_shipping_address || null,
        customer_city: data.customer_city || null,
        customer_state: data.customer_state || null,
        customer_country: data.customer_country || null,
        customer_pincode: data.customer_pincode || null,
        customer_pan_number: data.customer_pan_number || null,
        customer_gstin_number: data.customer_gstin_number || null,
        customer_type: data.customer_type || null,
        customer_category_id: data.customer_category_id || null,

        // ✅ Ensure numbers are properly converted
        opening_balance:
          data.opening_balance !== undefined ? Number(data.opening_balance) : 0,
        customer_credit_limit:
          data.customer_credit_limit !== undefined
            ? Number(data.customer_credit_limit)
            : 0,
        customer_credit_period:
          data.customer_credit_period !== undefined
            ? Number(data.customer_credit_period)
            : 0,
        customer_final_balance:
          data.customer_final_balance !== undefined
            ? Number(data.customer_final_balance)
            : 0,
      })),
    });

    // ⚠️ Note: createMany returns only { count: <number> }
    return providerCustomers;
  } catch (err) {
    console.error("❌ Prisma Error in createBulkProviderCustomers:", err);
    throw err;
  }
};

export {
  getProviderByUserId,
  createProviderCustomer,
  createBulkProviderCustomers,
};
