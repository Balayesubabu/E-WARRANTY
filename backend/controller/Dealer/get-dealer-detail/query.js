import { ProviderDealer, ProviderWarrantyCustomer, ProviderProductWarrantyCode, Provider } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    return await Provider.findFirst({ where: { user_id } });
};

const getDealerById = async (dealer_id) => {
    return await ProviderDealer.findUnique({ where: { id: dealer_id } });
};

const getDealerWarrantyStats = async (dealer_id) => {
    const totalRegistrations = await ProviderWarrantyCustomer.count({
        where: { dealer_id },
    });

    const rawRegistrations = await ProviderWarrantyCustomer.findMany({
        where: { dealer_id },
        orderBy: { created_at: "desc" },
        take: 10,
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            created_at: true,
            provider_warranty_code: {
                select: {
                    id: true,
                    warranty_code: true,
                    product_name: true,
                },
            },
        },
    });

    const recentRegistrations = rawRegistrations.map((r) => ({
        id: r.id,
        customer_name: [r.first_name, r.last_name].filter(Boolean).join(" "),
        customer_email: r.email,
        customer_phone: r.phone,
        created_at: r.created_at,
        warranty_code: r.provider_warranty_code
            ? {
                  id: r.provider_warranty_code.id,
                  warranty_code: r.provider_warranty_code.warranty_code,
                  product: { product_name: r.provider_warranty_code.product_name },
              }
            : null,
    }));

    const assignedCodes = await ProviderProductWarrantyCode.count({
        where: { assigned_dealer_id: dealer_id },
    });

    const registeredCodes = await ProviderProductWarrantyCode.count({
        where: { assigned_dealer_id: dealer_id, warranty_code_status: "Active" },
    });

    return {
        totalRegistrations,
        recentRegistrations,
        assignedCodes,
        registeredCodes,
    };
};

export { getProviderByUserId, getDealerById, getDealerWarrantyStats };
