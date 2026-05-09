import { Provider, ProviderProductWarrantyCode, ProviderDealer, WarrantyBatch } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getProviderWarrantyCodes = async (provider_id) => {
    const warranty_codes = await ProviderProductWarrantyCode.findMany({
        where: {
            provider_id: provider_id
        },
        include: {
            assigned_dealer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    dealer_key: true
                }
            }
        },
        orderBy:{
            created_at: 'desc'
        }
    });
    return warranty_codes;
}

/**
 * Get only available (Inactive) warranty codes for a given provider.
 * Used by dealers and customers to see which products can be registered.
 */
const getAvailableWarrantyCodes = async (provider_id, dealer_id = null) => {
    const where_clause = {
        provider_id: provider_id,
        warranty_code_status: "Inactive",
        is_active: true,
        is_deleted: false
    };

    // When dealer_id is supplied (customer selects a dealer), only show dealer-assigned codes.
    if (dealer_id) {
        where_clause.assigned_dealer_id = dealer_id;
    }

    const warranty_codes = await ProviderProductWarrantyCode.findMany({
        where: where_clause,
        orderBy: {
            created_at: 'desc'
        },
        include: {
            batch: {
                select: { policy_snapshot: true }
            }
        }
    });
    return warranty_codes;
}

const getDealerByIdAndProviderId = async (dealer_id, provider_id) => {
    const dealer = await ProviderDealer.findFirst({
        where: {
            id: dealer_id,
            provider_id: provider_id,
            status: "ACTIVE",
            is_active: true,
            is_deleted: false
        }
    });
    return dealer;
};

const getWarrantyCodeByIdAndProviderId = async (warranty_code_id, provider_id) => {
    const warranty_code = await ProviderProductWarrantyCode.findFirst({
        where: {
            id: warranty_code_id,
            provider_id: provider_id,
            is_active: true,
            is_deleted: false
        }
    });
    return warranty_code;
};

const assignWarrantyCodeToDealer = async (provider_id, warranty_code_id, dealer_id) => {
    const updated_warranty_code = await ProviderProductWarrantyCode.updateMany({
        where: {
            id: warranty_code_id,
            provider_id: provider_id,
            warranty_code_status: "Inactive",
            is_active: true,
            is_deleted: false
        },
        data: {
            assigned_dealer_id: dealer_id
        }
    });
    return updated_warranty_code;
};

const getWarrantyBatchAssignmentStats = async (provider_id, group_id) => {
    const base_where = {
        provider_id: provider_id,
        group_id: group_id,
        is_active: true,
        is_deleted: false
    };

    const [total_codes, available_codes] = await Promise.all([
        ProviderProductWarrantyCode.count({
            where: base_where
        }),
        ProviderProductWarrantyCode.count({
            where: {
                ...base_where,
                warranty_code_status: "Inactive"
            }
        })
    ]);

    return { total_codes, available_codes };
};

const assignWarrantyCodeBatchToDealer = async (provider_id, group_id, dealer_id) => {
    const updated_warranty_codes = await ProviderProductWarrantyCode.updateMany({
        where: {
            provider_id: provider_id,
            group_id: group_id,
            warranty_code_status: "Inactive",
            is_active: true,
            is_deleted: false
        },
        data: {
            assigned_dealer_id: dealer_id
        }
    });

    // Also update the batch's assigned_dealer_id for display in View All Product
    if (updated_warranty_codes.count > 0) {
        const sampleCode = await ProviderProductWarrantyCode.findFirst({
            where: { provider_id, group_id, is_active: true, is_deleted: false },
            select: { batch_id: true }
        });
        if (sampleCode?.batch_id) {
            await WarrantyBatch.update({
                where: { id: sampleCode.batch_id },
                data: { assigned_dealer_id: dealer_id }
            });
        }
    }

    return updated_warranty_codes;
};

const getDealerAssignedAvailableWarrantyCodes = async (provider_id, dealer_id) => {
    const warranty_codes = await ProviderProductWarrantyCode.findMany({
        where: {
            provider_id: provider_id,
            assigned_dealer_id: dealer_id,
            warranty_code_status: "Inactive",
            is_active: true,
            is_deleted: false
        },
        orderBy: {
            created_at: 'desc'
        },
        include: {
            batch: {
                select: { policy_snapshot: true }
            }
        }
    });
    return warranty_codes;
};

const getWarrantyCodeSummaryByProviderId = async (provider_id) => {
    const base_where = {
        provider_id: provider_id,
        is_active: true,
        is_deleted: false
    };

    const [total_codes, available_codes, assigned_codes, activated_codes, pending_codes] = await Promise.all([
        ProviderProductWarrantyCode.count({
            where: base_where
        }),
        ProviderProductWarrantyCode.count({
            where: {
                ...base_where,
                warranty_code_status: "Inactive",
                assigned_dealer_id: null
            }
        }),
        ProviderProductWarrantyCode.count({
            where: {
                ...base_where,
                warranty_code_status: "Inactive",
                assigned_dealer_id: {
                    not: null
                }
            }
        }),
        ProviderProductWarrantyCode.count({
            where: {
                ...base_where,
                warranty_code_status: "Active"
            }
        }),
        ProviderProductWarrantyCode.count({
            where: {
                ...base_where,
                warranty_code_status: "Pending"
            }
        })
    ]);

    return {
        total_codes,
        available_codes,
        assigned_codes,
        activated_codes,
        pending_codes
    };
};

const getWarrantyBatchUnassignStats = async (provider_id, group_id) => {
    const base_where = {
        provider_id: provider_id,
        group_id: group_id,
        is_active: true,
        is_deleted: false
    };

    const [total_codes, unassignable_codes, registered_codes] = await Promise.all([
        ProviderProductWarrantyCode.count({
            where: base_where
        }),
        ProviderProductWarrantyCode.count({
            where: {
                ...base_where,
                warranty_code_status: "Inactive",
                assigned_dealer_id: { not: null }
            }
        }),
        ProviderProductWarrantyCode.count({
            where: {
                ...base_where,
                warranty_code_status: "Active"
            }
        })
    ]);

    return { total_codes, unassignable_codes, registered_codes };
};

const unassignWarrantyCodeFromDealer = async (provider_id, warranty_code_id) => {
    const updated_warranty_code = await ProviderProductWarrantyCode.updateMany({
        where: {
            id: warranty_code_id,
            provider_id: provider_id,
            warranty_code_status: { notIn: ["Active", "Pending"] },
            assigned_dealer_id: { not: null },
            is_active: true,
            is_deleted: false
        },
        data: {
            assigned_dealer_id: null
        }
    });
    return updated_warranty_code;
};

const unassignWarrantyCodeBatchFromDealer = async (provider_id, group_id) => {
    // First get the batch_id before unassigning
    const sampleCode = await ProviderProductWarrantyCode.findFirst({
        where: { provider_id, group_id, is_active: true, is_deleted: false },
        select: { batch_id: true }
    });

    const updated_warranty_codes = await ProviderProductWarrantyCode.updateMany({
        where: {
            provider_id: provider_id,
            group_id: group_id,
            warranty_code_status: { notIn: ["Active", "Pending"] },
            assigned_dealer_id: { not: null },
            is_active: true,
            is_deleted: false
        },
        data: {
            assigned_dealer_id: null
        }
    });

    // Also clear the batch's assigned_dealer_id for display in View All Product
    if (updated_warranty_codes.count > 0 && sampleCode?.batch_id) {
        await WarrantyBatch.update({
            where: { id: sampleCode.batch_id },
            data: { assigned_dealer_id: null }
        });
    }

    return updated_warranty_codes;
};

/**
 * Assign a specific count of warranty codes from a batch to a dealer.
 * Only assigns Inactive codes that are not already assigned to a dealer.
 */
const assignPartialBatchToDealer = async (provider_id, group_id, dealer_id, count) => {
    // Get unassigned Inactive codes from the batch
    const availableCodes = await ProviderProductWarrantyCode.findMany({
        where: {
            provider_id: provider_id,
            group_id: group_id,
            warranty_code_status: "Inactive",
            assigned_dealer_id: null,
            is_active: true,
            is_deleted: false
        },
        select: { id: true },
        take: count,
        orderBy: { created_at: 'asc' }
    });

    if (availableCodes.length === 0) {
        return { count: 0 };
    }

    const codeIds = availableCodes.map(c => c.id);

    const updated = await ProviderProductWarrantyCode.updateMany({
        where: {
            id: { in: codeIds }
        },
        data: {
            assigned_dealer_id: dealer_id
        }
    });

    return updated;
};

/**
 * Unassign a specific count of warranty codes from a dealer in a batch.
 * Only unassigns Inactive codes that are assigned to a specific dealer.
 */
const unassignPartialBatchFromDealer = async (provider_id, group_id, dealer_id, count) => {
    // Get assigned codes (exclude Active/Pending - registered codes) from the batch for the specific dealer
    const assignedCodes = await ProviderProductWarrantyCode.findMany({
        where: {
            provider_id: provider_id,
            group_id: group_id,
            warranty_code_status: { notIn: ["Active", "Pending"] },
            assigned_dealer_id: dealer_id,
            is_active: true,
            is_deleted: false
        },
        select: { id: true },
        take: count,
        orderBy: { created_at: 'asc' }
    });

    if (assignedCodes.length === 0) {
        return { count: 0 };
    }

    const codeIds = assignedCodes.map(c => c.id);

    const updated = await ProviderProductWarrantyCode.updateMany({
        where: {
            id: { in: codeIds }
        },
        data: {
            assigned_dealer_id: null
        }
    });

    return updated;
};

/**
 * Get dealer assignment breakdown for a batch.
 * Returns how many codes each dealer has and how many are unassigned.
 */
const getBatchDealerAssignments = async (provider_id, group_id) => {
    const codes = await ProviderProductWarrantyCode.findMany({
        where: {
            provider_id: provider_id,
            group_id: group_id,
            warranty_code_status: "Inactive",
            is_active: true,
            is_deleted: false
        },
        select: {
            id: true,
            assigned_dealer_id: true,
            assigned_dealer: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    // Group by dealer
    const dealerCounts = {};
    let unassignedCount = 0;

    for (const code of codes) {
        if (code.assigned_dealer_id && code.assigned_dealer) {
            if (!dealerCounts[code.assigned_dealer_id]) {
                dealerCounts[code.assigned_dealer_id] = {
                    dealer_id: code.assigned_dealer_id,
                    dealer_name: code.assigned_dealer.name,
                    dealer_email: code.assigned_dealer.email,
                    count: 0
                };
            }
            dealerCounts[code.assigned_dealer_id].count++;
        } else {
            unassignedCount++;
        }
    }

    return {
        total_available: codes.length,
        unassigned: unassignedCount,
        assignments: Object.values(dealerCounts)
    };
};

export {
    getProviderByUserId,
    getProviderWarrantyCodes,
    getAvailableWarrantyCodes,
    getDealerByIdAndProviderId,
    getWarrantyCodeByIdAndProviderId,
    assignWarrantyCodeToDealer,
    getWarrantyBatchAssignmentStats,
    assignWarrantyCodeBatchToDealer,
    getDealerAssignedAvailableWarrantyCodes,
    getWarrantyCodeSummaryByProviderId,
    getWarrantyBatchUnassignStats,
    unassignWarrantyCodeFromDealer,
    unassignWarrantyCodeBatchFromDealer,
    assignPartialBatchToDealer,
    unassignPartialBatchFromDealer,
    getBatchDealerAssignments
};
