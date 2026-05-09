import { Owner, Dealer, AuditLog } from "../../../prisma/db-models.js";

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

const getDealerWithFullStatus = async (dealer_id) => {
    const dealer = await Dealer.findUnique({
        where: { id: dealer_id },
        select: {
            id: true,
            name: true,
            email: true,
            phone_number: true,
            status: true,
            is_active: true,
            is_deleted: true,
            inactivated_at: true,
            inactivated_by: true,
            inactivation_reason: true,
            created_at: true,
            updated_at: true
        }
    });
    return dealer;
};

const getDealerAuditLogs = async (dealer_id, limit = 20) => {
    const logs = await AuditLog.findMany({
        where: {
            entity_type: 'Dealer',
            entity_id: dealer_id
        },
        orderBy: { created_at: 'desc' },
        take: limit
    });
    return logs;
};

export { getOwnerByUserId, getDealerById, getDealerWithFullStatus, getDealerAuditLogs };
