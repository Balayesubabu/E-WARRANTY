import { prisma, Provider, SubModule, Module} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
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

// const createStaffRoleAndPermissions = async (provider_id, name, description, sub_module_ids_permissions) => {
//     const staff_role = await prisma.$transaction(async (tx) => {
//         const staff_role = await tx.staffRole.create({
//             data: {
//                 name,
//                 description,
//                 provider_id,
//                 is_active: true,
//                 is_deleted: false,
//             }
//         })
//         console.log("staff role ",staff_role);
//         console.log(sub_module_ids_permissions);
//         for (const sub_module_id_permission of sub_module_ids_permissions) {
//             const {
//                 sub_module_id,
//                 module_id,
//                 access_type
//             } = sub_module_id_permission;

//             console.log("sub modules ",sub_module_id_permission);

//             const staff_role_permission = await tx.staffRolePermission.create({
//                 data: {
//                     staff_role_id: staff_role.id,
//                     sub_module_id,
//                     module_id,
//                     access_type,
//                 }
//             })
//             console.log(staff_role_permission);
//         }

//         // return staff_role;
//     })
//     return staff_role;
// }

const createStaffRoleAndPermissions = async (provider_id, name, description, sub_module_ids_permissions) => {
    const staff_role = await prisma.$transaction(async (tx) => {
      // Create the staff role
      const staff_role = await tx.staffRole.create({
        data: {
          name,
          description,
          provider_id,
          is_active: true,
          is_deleted: false,
        },
      });
  
    //   console.log("Staff role created:", staff_role);
  
      // Create related permissions
      const permissions = [];
      for (const sub_module_id_permission of sub_module_ids_permissions) {
        const { sub_module_id, module_id, access_type } = sub_module_id_permission;  
        const staff_role_permission = await tx.staffRolePermission.create({
          data: {
            staff_role_id: staff_role.id,
            sub_module_id,
            module_id,
            access_type,
          },
        });
        permissions.push(staff_role_permission);
      }
  
      // Return both role and permissions as a single object
      return { staff_role, permissions };
    });
    console.log(staff_role);
    return staff_role; // will contain both role + permissions
  };

export { getProviderByUserId, getSubModuleById, createStaffRoleAndPermissions, getModuleById};