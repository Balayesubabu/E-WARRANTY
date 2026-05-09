import { Provider, ProviderDealer } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    return Provider.findFirst({
        where: { user_id },
    });
};

const getDealerByEmailAndProviderId = async (email, provider_id) => {
    return ProviderDealer.findFirst({
        where: {
            email: email,
            provider_id: provider_id,
        },
    });
};

const softDeleteDealer = async (dealer_id) => {
    return ProviderDealer.update({
        where: { id: dealer_id },
        data: {
            is_deleted: true,
            deleted_at: new Date(),
            is_active: false,
        },
    });
};

export { getProviderByUserId, getDealerByEmailAndProviderId, softDeleteDealer };
