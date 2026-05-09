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

const getDepartmentFranchise = async (franchise_id, provider_id) => {
    const department = await Department.findMany({
        where: {
            franchise_id: franchise_id,
            provider_id: provider_id
        }
    });
    return department;
}
export { getProviderByUserId, getDepartmentFranchise};