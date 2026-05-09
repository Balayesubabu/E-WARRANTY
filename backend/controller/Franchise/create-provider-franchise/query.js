import { Provider, Franchise } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const createFranchise = async (provider, data) => {
    const franchise = await Franchise.create({
        data: {
            name: data.name,
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
            pin_code: data.pin_code,
            phone_number: data.phone_number,
            email: data.email,
            provider_id: provider.id,
            created_by_id: provider.user_id,
        }
    });
    return franchise;
}

const getTotalFranchisesByProviderId = async (provider_id) => {
    const total_franchises = await Franchise.count({
        where: {
            provider_id: provider_id    
        }
    });
    return total_franchises;
}

export { getProviderByUserId, createFranchise, getTotalFranchisesByProviderId};