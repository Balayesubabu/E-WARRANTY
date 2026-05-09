import { ProviderProductWarrantyCode } from "../../../../prisma/db-models.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

/**
 * Public endpoint: Look up warranty code for customer registration (no auth).
 * Used when QR doesn't work - customer enters warranty code manually.
 * Returns product + dealer info so customer can register without selecting company/dealer/product.
 */
const lookupByCodeForRegistrationEndpoint = async (req, res) => {
    try {
        const codeInput = (req.query?.code || req.query?.warranty_code || "").toString().trim();
        if (!codeInput) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Warranty code is required");
        }

        const code = await ProviderProductWarrantyCode.findFirst({
            where: { warranty_code: codeInput },
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
            return returnError(res, StatusCodes.NOT_FOUND, "Warranty code not found. Please check the code and try again.");
        }

        if (code.is_deleted) {
            return returnError(res, StatusCodes.GONE, "This warranty code has been deactivated");
        }

        if (code.warranty_code_status !== "Inactive") {
            const statusMsg = code.warranty_code_status === "Active"
                ? "already registered"
                : code.warranty_code_status === "Pending"
                ? "pending dealer approval"
                : "not available for registration";
            return returnError(res, StatusCodes.BAD_REQUEST, `This warranty code is ${statusMsg}`);
        }

        if (!code.assigned_dealer_id || !code.assigned_dealer) {
            return returnError(res, StatusCodes.BAD_REQUEST, "This warranty code is not assigned to a dealer yet. Please contact your retailer.");
        }

        const policySnapshot = code.batch?.policy_snapshot || null;
        const customFields = policySnapshot?.custom_fields || [];

        return returnResponse(res, StatusCodes.OK, "Warranty code found", {
            provider_id: code.provider.id,
            provider_name: code.provider.company_name,
            provider_logo: code.provider.company_logo,
            product_name: code.product_name,
            product_id: code.product_id || "",
            service_id: code.service_id || "",
            serial_no: code.serial_no || "",
            warranty_code: code.warranty_code,
            warranty_days: code.warranty_days,
            warranty_period_readable: code.warranty_period_readable,
            assigned_dealer: {
                id: code.assigned_dealer.id,
                name: code.assigned_dealer.name,
                email: code.assigned_dealer.email,
            },
            custom_fields: customFields,
            terms_and_conditions: code.terms_and_conditions || [],
            terms_and_conditions_link: code.terms_and_conditions_link || null,
        });
    } catch (error) {
        logger.error(`lookupByCodeForRegistrationEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to lookup warranty code");
    }
};

export { lookupByCodeForRegistrationEndpoint };
