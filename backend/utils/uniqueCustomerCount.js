import { prisma } from "../prisma/db-models.js";

/**
 * Count unique customers globally by (email, phone) across all providers.
 * One person with multiple product registrations = 1 customer.
 *
 * @returns {Promise<number>} Unique customer count
 */
export async function countUniqueCustomersGlobally() {
    const where = { is_deleted: false };
    try {
        const groups = await prisma.providerWarrantyCustomer.groupBy({
            by: ["email", "phone"],
            where,
        });
        return groups.length;
    } catch (err) {
        const count = await prisma.providerWarrantyCustomer.count({ where });
        return count;
    }
}

/**
 * Count unique customers by (email, phone) within a provider.
 * One person with multiple product registrations = 1 customer.
 *
 * @param {string} providerId - Provider ID
 * @param {object} options - { dealerId?: string }
 * @returns {Promise<number>} Unique customer count
 */
export async function countUniqueCustomers(providerId, options = {}) {
    const where = { provider_id: providerId, is_deleted: false };
    if (options.dealerId) {
        where.dealer_id = options.dealerId;
    }

    try {
        const groups = await prisma.providerWarrantyCustomer.groupBy({
            by: ["email", "phone"],
            where,
        });
        return groups.length;
    } catch (err) {
        // Fallback: if groupBy fails (e.g. nullable columns), use row count
        const count = await prisma.providerWarrantyCustomer.count({ where });
        return count;
    }
}
