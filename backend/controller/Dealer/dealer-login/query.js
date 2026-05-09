import { ProviderDealer, Franchise, Provider } from "../../../prisma/db-models.js";

const getDealerByEmailOrPhone = async (email, phone) => {
    const conditions = [];
    if (email) conditions.push({ email: { equals: email, mode: "insensitive" } });
    if (phone) conditions.push({ phone_number: { equals: phone, mode: "insensitive" } });
    if (conditions.length === 0) return null;

    const dealer = await ProviderDealer.findFirst({
        where: {
            OR: conditions,
            is_deleted: false,
        },
        include: {
            provider: {
                include: {
                    user: true
                }
            }
        }
    });
    return dealer;
};

const getFranchiseByProviderId = async (provider_id) => {
    const franchise = await Franchise.findFirst({
        where: {
            provider_id: provider_id,
            is_deleted: false,
            is_active: true
        }
    });
    return franchise;
};

export { getDealerByEmailOrPhone, getFranchiseByProviderId };
