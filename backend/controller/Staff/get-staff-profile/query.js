import { Staff } from "../../../prisma/db-models.js";

const getStaffById = async (staff_id) => {
    const staff_data = await Staff.findUnique({
        where: {
            id: staff_id
        }
    })
    return staff_data;
}

const getStaffDetailsById = async (provider_id, staff_id, franchise_id) => {
    const where = {
        id: staff_id,
        provider_id: provider_id,
    };
    if (franchise_id != null && franchise_id !== undefined) {
        where.franchise_id = franchise_id;
    }
    const staff = await Staff.findFirst({
        where,
        include: {
            provider: true,
            franchise: true,
            StaffRolePermission: {
                where: { is_deleted: false },
                select: { sub_module_id: true, module_id: true, access_type: true }
            }
        }
    })
    return staff;
}

export { getStaffDetailsById, getStaffById };