import { ProviderProductWarrantyCode } from "../../../../prisma/db-models.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

/**
 * Public endpoint: Look up warranty code by product name + serial number (no auth).
 * Used when customer can't scan QR or read warranty code - they enter product and serial.
 * Returns same structure as lookup-by-code-for-registration.
 */
const lookupByProductSerialEndpoint = async (req, res) => {
    try {
        const productName = (req.query?.product_name || "").toString().trim();
        const serialNo = (req.query?.serial_no || req.query?.serial_number || "").toString().trim();

        if (!productName && !serialNo) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Product name or serial number is required");
        }

        const whereClause = {
            warranty_code_status: "Inactive",
            is_active: true,
            is_deleted: false,
            assigned_dealer_id: { not: null },
        };

        if (productName) {
            whereClause.product_name = {
                contains: productName,
                mode: "insensitive",
            };
        }
        if (serialNo) {
            whereClause.serial_no = {
                contains: serialNo,
                mode: "insensitive",
            };
        }

        const code = await ProviderProductWarrantyCode.findFirst({
            where: whereClause,
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
            orderBy: { created_at: "desc" },
        });

        if (!code) {
            return returnError(
                res,
                StatusCodes.NOT_FOUND,
                "No matching product found. Please check product name and serial number."
            );
        }

        if (!code.assigned_dealer_id || !code.assigned_dealer) {
            return returnError(res, StatusCodes.BAD_REQUEST, "This warranty code is not assigned to a dealer yet.");
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
        logger.error(`lookupByProductSerialEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to lookup warranty code");
    }
};

export { lookupByProductSerialEndpoint };
