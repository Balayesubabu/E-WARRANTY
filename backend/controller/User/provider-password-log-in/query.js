import { User, ProviderSubscription, Franchise, Provider } from "../../../prisma/db-models.js";

const getUserByEmailOrPhoneNumber = async (email, phone_number) => {
    const conditions = [];
    if (email) conditions.push({ email: { equals: email, mode: 'insensitive' } });
    if (phone_number) conditions.push({ phone_number: phone_number });
    if (conditions.length === 0) return null;

    const user = await User.findFirst({
        where: {
            OR: conditions
        },
        include: {
            Provider: true
        }
    });
    return user;
}

const checkUserSubscription = async (provider_id) => {
    const subscription = await ProviderSubscription.findFirst({
        where: {
            provider_id: provider_id,
            is_active: true,
            is_base_plan_active: true,
            end_date: {
                gt: new Date()
            },
            subscription_plan: {
                is_base_plan: true
            }
        }
    });
    return subscription;
}

const getProviderFranchises = async (provider_id) => {
    console.log(provider_id);
    const franchise = await Franchise.findMany({
        where: {
            provider_id: provider_id
        }
    });
    console.log(franchise);
    return franchise;
}

const getFranchisesByProviderId = async (provider_id) => {
    console.log(provider_id);
    const franchises = await Franchise.findFirst({
        where: {
            provider_id: provider_id
        },
        orderBy: {
            created_at: 'asc'
        }
    });
    return franchises;  
}

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}


export { getUserByEmailOrPhoneNumber, checkUserSubscription, getProviderFranchises, getFranchisesByProviderId, getProviderByUserId};