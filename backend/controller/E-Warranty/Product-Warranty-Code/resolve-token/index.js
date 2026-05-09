import { ProviderProductWarrantyCode } from "../../../../prisma/db-models.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const resolveTokenEndpoint = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Activation token is required");
        }

        const code = await ProviderProductWarrantyCode.findUnique({
            where: { activation_token: token },
            include: {
                provider: {
                    select: {
                        id: true,
                        company_name: true,
                        company_logo: true,
                    },
                },
                assigned_dealer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                batch: {
                    select: {
                        id: true,
                        batch_name: true,
                        policy_snapshot: true,
                    },
                },
            },
        });

        if (!code) {
            return returnError(res, StatusCodes.NOT_FOUND, "Invalid or expired activation link");
        }

        if (code.is_deleted) {
            return returnError(res, StatusCodes.GONE, "This warranty code has been deactivated");
        }

        const isRegistered = code.warranty_code_status === "Active" || code.warranty_code_status === "Pending";

        const policySnapshot = code.batch?.policy_snapshot || null;
        const customFields = policySnapshot?.custom_fields || [];

        return returnResponse(res, StatusCodes.OK, "Token resolved", {
            provider_id: code.provider.id,
            provider_name: code.provider.company_name,
            provider_logo: code.provider.company_logo,
            product_name: code.product_name,
            product_id: code.product_id,
            service_id: code.service_id,
            serial_no: code.serial_no,
            warranty_code: code.warranty_code,
            warranty_days: code.warranty_days,
            warranty_period_readable: code.warranty_period_readable,
            status: code.warranty_code_status,
            is_registered: isRegistered,
            assigned_dealer: code.assigned_dealer
                ? { id: code.assigned_dealer.id, name: code.assigned_dealer.name, email: code.assigned_dealer.email }
                : null,
            policy_snapshot: policySnapshot,
            custom_fields: customFields,
            terms_and_conditions: code.terms_and_conditions || [],
            terms_and_conditions_link: code.terms_and_conditions_link || null,
        });
    } catch (error) {
        logger.error(`resolveTokenEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to resolve activation token");
    }
};

export { resolveTokenEndpoint };
