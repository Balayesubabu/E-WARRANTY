import { Owner, Franchise } from "../../../prisma/db-models.js";

const getOwnerByUserId = async (user_id) => {
    const owner = await Owner.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return owner;
};

const getFranchiseByOwnerId = async (owner_id) => {
    const franchise = await Franchise.findFirst({
        where: {
            provider_id: owner_id,
        },
        orderBy: {
            created_at: "asc",
        },
    });
    return franchise;
};

const createDefaultFranchise = async (owner) => {
    const franchise = await Franchise.create({
        data: {
            provider_id: owner.id,
            name: owner.company_name || "Main Branch",
            address: owner.company_address || null,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
        },
    });
    return franchise;
};

export { getOwnerByUserId, getFranchiseByOwnerId, createDefaultFranchise };
