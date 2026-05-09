import { User } from "../../../prisma/db-models.js";

const getCustomerByEmailOrPhoneNumber = async (email, phone_number) => {
  // Build OR conditions only for provided values
  const orConditions = [];
  
  if (email) {
    orConditions.push({ email: email });
  }
  
  if (phone_number) {
    orConditions.push({ phone_number: phone_number });
  }
  
  // If no conditions, return null
  if (orConditions.length === 0) {
    return null;
  }
  
  const user = await User.findFirst({
    where: {
      OR: orConditions,
    },
  });
  
  return user;
};

export { getCustomerByEmailOrPhoneNumber };
