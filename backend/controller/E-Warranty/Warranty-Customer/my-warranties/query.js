import { User, ProviderWarrantyCustomer, WarrantyClaim } from "../../../../prisma/db-models.js";

/**
 * Get User by ID to extract phone_number and email
 */
const getUserById = async (user_id) => {
    const user = await User.findUnique({
        where: {
            id: user_id
        }
    });
    return user;
};

/**
 * Get all warranty registrations for a customer by phone number OR email.
 * Uses OR so registrations are found regardless of which credential the
 * customer used to log in.  Skips temp_* placeholder phone numbers created
 * by the passwordless-auth flow and normalises phone to last-10 digits to
 * handle country-code variations.
 */
const getCustomerWarranties = async (phone_number, email) => {
    const realPhone = phone_number && !phone_number.startsWith("temp_") ? phone_number : null;
    const realEmail = email || null;

    if (!realPhone && !realEmail) return [];

    const orConditions = [];

    if (realPhone) {
        const digits = realPhone.replace(/\D/g, "");
        const last10 = digits.length > 10 ? digits.slice(-10) : digits;
        if (last10) {
            orConditions.push({ phone: { endsWith: last10 } });
        }
    }

    if (realEmail) {
        orConditions.push({ email: { equals: realEmail, mode: "insensitive" } });
    }

    if (orConditions.length === 0) return [];

    const warranties = await ProviderWarrantyCustomer.findMany({
        where: {
            is_deleted: false,
            OR: orConditions,
        },
        include: {
            provider: true,
            dealer: {
                include: {
                    provider: true
                }
            },
            provider_warranty_code: true,
            WarrantyClaim: {
                where: { is_active: true },
                orderBy: { created_at: 'desc' },
                include: {
                    assigned_service_center: true,
                    claim_history: {
                        orderBy: { created_at: 'desc' },
                        take: 3
                    }
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    return warranties;
};

export { getUserById, getCustomerWarranties };
