import { Provider,  CustomerRequirements} from "../../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const createCustomerRequirement = async (requirement_name, provider_id, franchise_id, staff_id) => {
    // Check if requirement already exists
    const existingRequirement = await CustomerRequirements.findFirst({
        where: {
            requirement_name: requirement_name,
            provider_id: provider_id,
            franchise_id: franchise_id
        }
    });

    // If exists, return it or skip
    if (existingRequirement) {
        return existingRequirement; // Or return null if you want to skip
    }

    // Create new requirement
    const requirement = await CustomerRequirements.create({
        data: {
            requirement_name: requirement_name,
            provider_id: provider_id,
            franchise_id: franchise_id,
            created_at: new Date(),
            created_by: staff_id || provider_id
        }
    });

    return requirement;
};

export { getProviderByUserId, createCustomerRequirement };