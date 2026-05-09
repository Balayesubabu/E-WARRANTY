import { PlatformActivityLog } from "../prisma/db-models.js";
import { logger } from "./logger.js";

/**
 * Log platform-wide activity (Super Admin, Provider, Dealer, Staff, Customer)
 * @param {Object} params
 * @param {string} params.actor_role - super_admin, provider, dealer, staff, customer
 * @param {string} params.actor_id - User/provider/dealer/staff/customer ID
 * @param {string} [params.actor_name] - Display name
 * @param {string} params.action - e.g. provider_blocked, dealer_created, warranty_registered
 * @param {string} [params.target_entity_type] - provider, dealer, staff, warranty, claim
 * @param {string} [params.target_entity_id]
 * @param {string} [params.target_name]
 * @param {string} [params.provider_id]
 * @param {Object} [params.details]
 */
export const logPlatformActivity = async (params) => {
    try {
        await PlatformActivityLog.create({
            data: {
                actor_role: params.actor_role,
                actor_id: params.actor_id,
                actor_name: params.actor_name || null,
                action: params.action,
                target_entity_type: params.target_entity_type || null,
                target_entity_id: params.target_entity_id || null,
                target_name: params.target_name || null,
                provider_id: params.provider_id || null,
                details: params.details || null,
            },
        });
    } catch (err) {
        logger.error(`PlatformActivityLog create failed: ${err?.message || err}`);
    }
};
