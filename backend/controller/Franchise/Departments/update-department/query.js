import { Department, Provider } from "../../../../prisma/db-models.js";
const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    console.log(provider);
    return provider;
}

const updateDepartmentFranchise = async (department_name,  franchise_id, provider_id,department_id) => {
    const department = await Department.updateMany({
        where: {
            franchise_id: franchise_id,
            provider_id: provider_id,
            id: department_id  
        },
        data: {
            department_name: department_name
        }  
    });
    return department;
}

export { getProviderByUserId, updateDepartmentFranchise };