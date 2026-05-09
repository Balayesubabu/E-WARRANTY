import { Provider, ProviderSubscription,Module, SubscriptionPlan, SubscriptionPlanModule } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getSubscribedModules = async (provider_id) => {
    const now = new Date();
    const provider_subscription = await ProviderSubscription.findMany({
        where: {
            provider_id,
            is_active: true,
            is_cancelled: false,
            start_date: { lte: now },
            end_date: { gte: now },
        },
        include: {
            subscription_plan: {
                include: {
                    modules: {
                        include: {
                            module: {
                                include: {
                                    SubModule: { orderBy: { id: "asc" } },
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    return provider_subscription;
};

const getTrialPlanModules = async () => {
    const trialPlan = await SubscriptionPlan.findFirst({
        where: {
            OR: [
                { name: { equals: "Developer Plan", mode: "insensitive" } },
                { name: { equals: "Trail Plan", mode: "insensitive" } },
                { name: { equals: "Trial Plan", mode: "insensitive" } },
            ],
            is_active: true,
            is_deleted: false,
        },
    });
    if (!trialPlan) return null;
    return SubscriptionPlanModule.findMany({
        where: { subscription_plan_id: trialPlan.id },
        include: {
            module: {
                include: { SubModule: { orderBy: { id: "asc" } } },
            },
        },
    });
};

export { getProviderByUserId, getSubscribedModules, getTrialPlanModules };