import { Owner, Dealer } from "../../../prisma/db-models.js";

const getOwnerByUserId = async (user_id) => {
    const owner = await Owner.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return owner;
};

const getDealerById = async (dealer_id, owner_id) => {
    const dealer = await Dealer.findFirst({
        where: {
            id: dealer_id,
            provider_id: owner_id,
        },
    });
    return dealer;
};

const getDealerWithStatus = async (dealer_id) => {
    const dealer = await Dealer.findUnique({
        where: { id: dealer_id },
        select: {
            id: true,
            name: true,
            email: true,
            status: true,
            is_active: true,
            inactivated_at: true,
            inactivated_by: true,
            inactivation_reason: true,
            provider_id: true
        }
    });
    return dealer;
};

export { getOwnerByUserId, getDealerById, getDealerWithStatus };
