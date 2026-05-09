import { User, Provider, Franchise, ProviderSubscription } from "../../../prisma/db-models.js";

const getUserByEmailOrPhoneNumber = async (email, phone_number) => {
    const conditions = [];
    if (email) conditions.push({ email: email });
    if (phone_number) conditions.push({ phone_number: phone_number });
    if (conditions.length === 0) return null;

    const user = await User.findFirst({
        where: {
            OR: conditions
        }
    });
    return user;
}

const updateUserVerified = async (user_id) => {
    const user = await User.update({
        where: {
            id: user_id
        },
        data: {
            is_otp_verified: true,
            is_phone_verified: true,
            is_email_verified: true
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

export { getUserByEmailOrPhoneNumber, updateUserVerified, getProviderByUserId, getFranchisesByProviderId, checkUserSubscription };