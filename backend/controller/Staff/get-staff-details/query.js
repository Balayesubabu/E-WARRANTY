import { Provider, Staff, StaffRolePermission } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getStaffById = async (provider_id, staff_id,franchise_id) => {
  const staff = await Staff.findFirst({
    where: {
      id: staff_id,
      provider_id: provider_id,
      franchise_id: franchise_id
    },
    include: {

      provider: true,
      franchise: true,
    },
  });
  const StaffRole = await StaffRolePermission.findMany({
    where: {
      staff_id: staff_id
    }
  });
  return {staff, StaffRole};
};

export { getProviderByUserId, getStaffById };
