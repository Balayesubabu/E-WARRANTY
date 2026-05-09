import{Provider, Staff, StaffRolePermission,Module,SubModule} from "../../../prisma/db-models.js";

const getStaffByUserId = async (staff_id) => {
  return await Staff.findFirst({
    where: { id: staff_id },
  });
};
const getProviderById = async (provider_id) => {
  return await Provider.findFirst({
    where: { id: provider_id },
  });
}
const getStaffRolePermissions = async (staff_id) => {
  return await StaffRolePermission.findMany({
    where: { staff_id },
    // include: { module: { include: { SubModule: true } } }
  });
};
const getModuleById = async (module_id) => {
  return await Module.findFirst({
    where: { id: module_id }
  });
};
const getSubModuleById = async (sub_module_id) => {
  return await SubModule.findFirst({
    where: { id: sub_module_id }
  });
};
export { getStaffByUserId, getProviderById, getStaffRolePermissions,getModuleById,getSubModuleById};