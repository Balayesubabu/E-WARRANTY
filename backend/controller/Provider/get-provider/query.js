import { Provider } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        },
        include: {
            user: true,
            FranchiseInventory: true,
            Category: true,
            ProviderCustomers: true,
            FranchiseService: true,
            TermsAndConditions: true,
            subscriptions: {
                include: {
                    subscription_plan: {
                        include: {
                            modules: {
                                include: {
                                    module: true,
                                }
                            }
                        }
                    }
                }
            },
            Franchise: true,
            FranchiseServicePackage: true,
            ProviderBankDetails: true
        }
    })
    return provider;
}

export { getProviderByUserId };
