import { Provider, StaffRole, Staff} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getStaffByStaffId = async (staff_id) => {
    const staff = await Staff.findUnique({
        where: {
            id: staff_id
        }
    })
    return staff;
}

const getStaffRolePermissions = async (provider_id,staff_role_id) => {
    const staff_role_permissions = await StaffRole.findFirst({
        where: {
            id: staff_role_id,
            provider_id: provider_id
        },
        include: {
            StaffRolePermission: {
                include: {
                    module: true,
                    sub_module: true
                }
            }
        }
    })
    return staff_role_permissions;
}

export { getProviderByUserId, getStaffRolePermissions, getStaffByStaffId};