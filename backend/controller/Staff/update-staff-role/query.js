import { Provider, Staff, StaffRole } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getStaffById = async (provider_id, staff_id) => {
    const staff = await Staff.findFirst({
        where: {
            id: staff_id,
            provider_id: provider_id
        }
    })
    return staff;
}

const getStaffRoleById = async (staff_role_id) => {
    const staff_role = await StaffRole.findFirst({
        where: {
            id: staff_role_id
        }
    })
    return staff_role;
}

const updateStaffRole = async (provider_id, staff_id, staff_role_id) => {
    const updated_staff = await Staff.update({
        where: {
            id: staff_id,
            provider_id: provider_id
        },
        data: {
            staff_role_id: staff_role_id
        }
    })
    return updated_staff;
}

export { getProviderByUserId, getStaffById, getStaffRoleById, updateStaffRole };