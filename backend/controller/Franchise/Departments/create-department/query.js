import { Department, Provider} from "../../../../prisma/db-models.js";
const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    console.log(provider);
    return provider;
}

const createDepartmentFranchise = async (department_name,  franchise_id, provider_id) => {
    const department = await Department.create({
        data: {
            department_name: department_name,
            provider_id: provider_id,
            franchise_id: franchise_id
        }
    });
    return department;
}


export { getProviderByUserId, createDepartmentFranchise };