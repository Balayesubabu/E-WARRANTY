import { User, ProviderSubscription, Franchise, Provider } from "../../../prisma/db-models.js";

const getUserByPhoneNumber = async (phone_number) => {
    const user = await User.findUnique({
        where: {
            phone_number: phone_number
        }
    });
    return user;
}
const getProviderFranchises = async (provider_id) => {
    const franchise = await Franchise.findMany({
        where: {
            provider_id: provider_id
        }
    });
    return franchise;
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

const getFranchisesByProviderId = async (provider_id) => {
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


export { getUserByPhoneNumber, getProviderFranchises, checkUserSubscription, getFranchisesByProviderId,getProviderByUserId};