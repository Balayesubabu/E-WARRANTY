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

const getDealerWithDetails = async (dealer_id) => {
    const dealer = await Dealer.findUnique({
        where: { id: dealer_id },
        include: {
            provider: {
                select: {
                    id: true,
                    company_name: true,
                    user_id: true
                }
            }
        }
    });
    return dealer;
};

export { getOwnerByUserId, getDealerById, getDealerWithDetails };
