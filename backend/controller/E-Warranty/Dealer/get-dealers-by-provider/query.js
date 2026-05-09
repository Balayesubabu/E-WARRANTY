import { Provider, ProviderDealer } from "../../../../prisma/db-models.js";

const getProviderById = async (provider_id) => {
    const provider = await Provider.findFirst({
        where: {
            id: provider_id,
        },
    });
    return provider;
}

const getDealerByProviderId = async (provider_id) => {
    const dealers = await ProviderDealer.findMany({
        where: {
            provider_id: provider_id,
            is_active: true,
            is_deleted: false,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone_number: true,
            city: true,
            state: true,
            dealer_key: true,
            is_active: true,
            is_deleted: true,
        },
        orderBy: {
            name: 'asc'
        }
    });
    return dealers;
}

export { getProviderById, getDealerByProviderId };