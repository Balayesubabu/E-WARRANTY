import { Provider, ProviderProductWarrantyCode } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getWarrantyCodesByBatchId = async (batch_id, provider_id) => {
    const warranty_codes = await ProviderProductWarrantyCode.findMany({
        where: {
            batch_id: batch_id,
            provider_id: provider_id,
            is_active: true,
            is_deleted: false
        },
        include: {
            assigned_dealer: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: {
            created_at: 'asc'
        }
    });
    return warranty_codes;
};

const getWarrantyCodesByProductId = async (product_master_id, provider_id) => {
    const warranty_codes = await ProviderProductWarrantyCode.findMany({
        where: {
            product_master_id: product_master_id,
            provider_id: provider_id,
            is_active: true,
            is_deleted: false
        },
        include: {
            assigned_dealer: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: {
            created_at: 'asc'
        }
    });
    return warranty_codes;
};

export { getProviderByUserId, getWarrantyCodesByBatchId, getWarrantyCodesByProductId };
