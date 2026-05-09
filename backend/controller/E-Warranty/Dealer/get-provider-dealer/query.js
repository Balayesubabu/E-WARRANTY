import { Provider, ProviderDealer } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider;
}

const getDealerByProviderId = async (provider_id) => {
    const dealer = await ProviderDealer.findMany({
        where: {
            provider_id: provider_id,
            is_deleted: false,
        },
    });
    return dealer;
}

export { getProviderByUserId, getDealerByProviderId };