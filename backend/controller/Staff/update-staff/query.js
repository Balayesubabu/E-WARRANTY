import { Staff, Provider,StaffRolePermission, SubModule, Module} from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getStaffById = async (provider_id, franchise_id, staff_id) => {
    const staff = await Staff.findFirst({
        where: {
            id: staff_id,
            provider_id: provider_id,
            franchise_id: franchise_id
        }
    })
    return staff;
}

const updateStaff = async (staff_id, franchise_id, data, sub_module_ids_permissions) => {
    const updateData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        franchise_id: franchise_id,
        address: data.address,
        department_id: data.department_id,
        designation: data.designation,
        role_type: data.role_type,
        is_active: data.is_active,
        is_deleted: data.is_deleted,
    };
    if (data.employee_id !== undefined) updateData.employee_id = data.employee_id;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.reports_to_id !== undefined) updateData.reports_to_id = data.reports_to_id || null;
    if (data.staff_status !== undefined) updateData.staff_status = data.staff_status;
    if (data.force_password_reset !== undefined) updateData.force_password_reset = data.force_password_reset;
    if (data.two_factor_enabled !== undefined) updateData.two_factor_enabled = data.two_factor_enabled;

    const updated_staff = await Staff.update({
        where: { id: staff_id },
        data: updateData,
    })

    const delete_permissions = await StaffRolePermission.deleteMany({
        where: {
            staff_id: staff_id
        }
    });

    const permissions = [];
      for (const sub_module_id_permission of sub_module_ids_permissions) {
        const { sub_module_id, module_id, access_type } = sub_module_id_permission;  
        const staff_role_permission = await StaffRolePermission.create({
          data: {
            staff_id: updated_staff.id,
            sub_module_id,
            module_id,
            access_type,
          },
        });
        permissions.push(staff_role_permission);
      }
  
      // Return both role and permissions as a single object
      return {updated_staff,permissions };
}

const getModuleById = async (module_id) => {
    const module = await Module.findUnique({
        where: {
            id: module_id
        }
    })
    return module;
}

const getSubModuleById = async (sub_module_id) => {
    const sub_module = await SubModule.findUnique({
        where: {
            id: sub_module_id
        },
        include: {
            module: true
        }
    })
    return sub_module;
}

const getStaffByEmailOrPhone = async (provider_id, email, phone, franchise_id) => {
  const staff = await Staff.findMany({});
  return staff;

};


export { getProviderByUserId, getStaffById, updateStaff, getModuleById, getSubModuleById,getStaffByEmailOrPhone};