import { Provider, ProviderSubscription, SubscriptionPlan, Transaction } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const createTransactionForOrderId = async (order_id, provider_id, amount, status, payment_id = null, transaction_status = "Pending") => {
    const transaction = await Transaction.create({
        data: {
            provider_id: provider_id,
            order_id: order_id,
            order_status: status,
            amount: amount,
            type: "Subscription",
            transaction_type: "Online",
            transaction_status: transaction_status,
            transaction_id: payment_id,
        }
    });
    return transaction;
};

const getTransactionByOrderId = async (order_id) => {
    const transaction = await Transaction.findFirst({
        where: {
            order_id: order_id,
        },
        orderBy: {
            created_at: "desc"
        }
    });
    return transaction;
};

const updateTransactionStatus = async (transaction_id, status, payment_id = null) => {
    const updateData = {
        transaction_status: status,
        updated_at: new Date(),
    };
    if (payment_id) {
        updateData.transaction_id = payment_id;
    }
    const transaction = await Transaction.update({
        where: {
            id: transaction_id,
        },
        data: updateData,
    });
    return transaction;
}

const isBasePlanActiveForProvider = async (provider_id) => {
    const providerSubscription = await ProviderSubscription.findFirst({
        where: {
            provider_id: provider_id,
            is_base_plan_active: true,
            start_date: {
                lte: new Date()
            },
            end_date: {
                gte: new Date()
            }
        }
    });
    return providerSubscription;
}

const isBasePlan = async (subscription_plan_id) => {
    const subscriptionPlan = await SubscriptionPlan.findFirst({
        where: {
            id: subscription_plan_id,
            is_base_plan: true
        }
    });
    return subscriptionPlan;
}

const createProviderSubscription = async (provider_id, data) => {
    const providerSubscription = await ProviderSubscription.create({
        data: {
            provider_id: provider_id,
            subscription_plan_id: data.subscription_plan_id,
            start_date: data.start_date,
            end_date: data.end_date,
            amount_paid: data.amount_paid,
            is_active: true,
            is_cancelled: false,
            is_base_plan_active: data.is_base_plan,
            cancelled_at: null,
        }
    });
    return providerSubscription;
}

const isSubscriptionActiveForProvider = async (provider_id,subscription_plan_id) => {
    const providerSubscription = await ProviderSubscription.findFirst({
        where: {
            provider_id: provider_id,
            is_active: true,
            subscription_plan_id: subscription_plan_id,
            start_date: {
                lte: new Date()
            },
            end_date: {
                gte: new Date()
            },
            is_cancelled: false
        }
    });
    return providerSubscription;
}

const updateProviderBranches = async (provider_id, total_branches) => {
    const updatedProvider = await Provider.update({
        where: {
            id: provider_id
        },
        data: {
            total_branches: total_branches
        }
    });
    return updatedProvider;
}

export { getProviderByUserId, isBasePlanActiveForProvider, isBasePlan, createProviderSubscription, isSubscriptionActiveForProvider, createTransactionForOrderId, updateProviderBranches, getTransactionByOrderId, updateTransactionStatus };