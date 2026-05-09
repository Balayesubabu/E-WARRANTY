import { AuditLog } from "../prisma/db-models.js";
import { logger } from "./logger.js";

/**
 * Create audit log using existing AuditLog model
 */
export const createAuditLog = async (params) => {
  try {
    await AuditLog.create({
      data: {
        entity_type: params.entity_type || "Unknown",
        entity_id: params.entity_id || "",
        action: params.action || "UNKNOWN",
        performed_by: params.performed_by || "system",
        reason: params.reason ?? null,
        old_values: params.old_values ?? null,
        new_values: params.new_values ?? null,
        ip_address: params.ip_address ?? null,
        user_agent: params.user_agent ?? null,
      },
    });
  } catch (err) {
    logger.error(`AuditLog create failed: ${err.message}`);
  }
};
