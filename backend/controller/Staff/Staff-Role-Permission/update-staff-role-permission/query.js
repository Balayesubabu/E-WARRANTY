import { prisma, Provider } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const updateStaffRole = async (provider_id, staff_role_id, name, description, sub_module_ids_permissions) => {
    const staff_role = await prisma.$transaction(async (tx) => {
        const staff_role = await tx.staffRole.update({
            where: {
                id: staff_role_id,
                provider_id
            },
            data: {
                name,
                description
            }
        })

        for (const sub_module_id_permission of sub_module_ids_permissions) {
            const {
                sub_module_id,
                module_id,
                access_type
            } = sub_module_id_permission;

            const staff_role_permission = await tx.staffRolePermission.update({
                where: {
                    staff_role_id: staff_role_id,
                    sub_module_id,
                    module_id
                },
                data: {
                    access_type
                }
            })

            if (!staff_role_permission) {
                const staff_role_permission = await tx.staffRolePermission.create({
                    data: {
                        staff_role_id: staff_role_id,
                        sub_module_id,
                        module_id,
                        access_type
                    }
                })
            }
        }

        return staff_role;
    })
    return staff_role;
}

export { getProviderByUserId, updateStaffRole };