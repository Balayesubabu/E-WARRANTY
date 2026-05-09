import { Provider, Staff, SubModule, Module,StaffRolePermission} from "../../../prisma/db-models.js"

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getStaffByEmailAndPhone = async (provider_id, email, phone, franchise_id) => {
    const conditions = [];
    if (email) conditions.push({ email: email });
    if (phone) conditions.push({ phone: phone });
    if (conditions.length === 0) return null;

    const staff = await Staff.findFirst({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            OR: conditions
        }
    })
    return staff;
}

const createStaff = async (provider_id, franchise_id, data, hashed_password, sub_module_ids_permissions) => {
    const staff = await Staff.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          password: hashed_password,
          provider_id: provider_id,
          franchise_id: franchise_id,
          role_type: data.role_type,
          department_id: data.department_id,
          designation: data.designation,
          employee_id: data.employee_id || null,
          department: data.department || null,
          region: data.region || null,
          reports_to_id: data.reports_to_id || null,
          staff_status: data.staff_status || "ACTIVE",
          force_password_reset: data.force_password_reset !== undefined ? data.force_password_reset : true,
          two_factor_enabled: data.two_factor_enabled || false,
        }
      });

    const permissions = [];
      for (const sub_module_id_permission of sub_module_ids_permissions) {
        const { sub_module_id, module_id, access_type } = sub_module_id_permission;  
        const staff_role_permission = await StaffRolePermission.create({
          data: {
            staff_id: staff.id,
            sub_module_id,
            module_id,
            access_type,
          },
        });
        permissions.push(staff_role_permission);
      }
  
      // Return both role and permissions as a single object
      return {staff,permissions };
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


export { getProviderByUserId, getStaffByEmailAndPhone, createStaff,getSubModuleById, getModuleById};