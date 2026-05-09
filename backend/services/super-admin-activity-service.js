import { SuperAdminActivityLog } from "../prisma/db-models.js";
import { logPlatformActivity } from "./platform-activity-service.js";
import { logger } from "./logger.js";

/**
 * Log a Super Admin platform action for audit trail (writes to both SuperAdminActivityLog and PlatformActivityLog)
 * @param {Object} params
 * @param {string} params.super_admin_id - User ID of Super Admin
 * @param {string} params.action - e.g. provider_blocked, provider_unblocked, coins_added, coins_deducted, dealer_activated, dealer_deactivated, staff_activated, staff_deactivated, service_center_activated, service_center_deactivated, coin_pricing_updated
 * @param {string} params.entity_type - provider, dealer, staff, service_center, coin_pricing
 * @param {string} [params.entity_id]
 * @param {string} [params.provider_id]
 * @param {string} [params.target_name] - Human-readable name
 * @param {Object} [params.details] - { amount, reason, old_values, new_values, etc. }
 * @param {string} [params.ip_address]
 */
export const logSuperAdminAction = async (params) => {
    try {
        await SuperAdminActivityLog.create({
            data: {
                super_admin_id: params.super_admin_id,
                action: params.action,
                entity_type: params.entity_type,
                entity_id: params.entity_id || null,
                provider_id: params.provider_id || null,
                target_name: params.target_name || null,
                details: params.details || null,
                ip_address: params.ip_address || null,
            },
        });
        await logPlatformActivity({
            actor_role: "super_admin",
            actor_id: params.super_admin_id,
            actor_name: null,
            action: params.action,
            target_entity_type: params.entity_type,
            target_entity_id: params.entity_id,
            target_name: params.target_name,
            provider_id: params.provider_id,
            details: params.details,
        });
    } catch (err) {
        logger.error(`SuperAdminActivityLog create failed: ${err?.message || err}`);
    }
};
