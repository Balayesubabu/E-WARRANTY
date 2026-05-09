import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { ProviderWarrantyCustomer } from "../../../prisma/db-models.js";

/**
 * Escape CSV cell: wrap in quotes if contains comma, newline, or quote
 */
function escapeCsvCell(val) {
    if (val == null || val === "") return "";
    const s = String(val);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

/**
 * GET /super-admin/warranty-registrations
 * List registered warranties (ProviderWarrantyCustomer) across all providers
 */
const warrantyRegistrationsListEndpoint = async (req, res) => {
    try {
        const { page = 1, limit = 20, provider_id, search, date_from, date_to } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(5, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const where = { is_deleted: false };
        if (provider_id && typeof provider_id === "string") where.provider_id = provider_id;
        if (search && typeof search === "string") {
            const term = search.trim();
            if (term) {
                where.OR = [
                    { serial_number: { contains: term, mode: "insensitive" } },
                    { warranty_code: { contains: term, mode: "insensitive" } },
                    { first_name: { contains: term, mode: "insensitive" } },
                    { last_name: { contains: term, mode: "insensitive" } },
                    { phone: { contains: term, mode: "insensitive" } },
                    { product_name: { contains: term, mode: "insensitive" } },
                ];
            }
        }
        if (date_from || date_to) {
            where.created_at = {};
            if (date_from) where.created_at.gte = new Date(date_from);
            if (date_to) {
                const d = new Date(date_to);
                d.setHours(23, 59, 59, 999);
                where.created_at.lte = d;
            }
        }

        const [items, total] = await Promise.all([
            ProviderWarrantyCustomer.findMany({
                where,
                include: {
                    provider: { select: { company_name: true, user: { select: { email: true } } } },
                    dealer: { select: { name: true } },
                    provider_warranty_code: {
                        select: { product_name: true, warranty_from: true, warranty_to: true, warranty_code_status: true },
                    },
                    WarrantyClaim: { select: { id: true } },
                },
                orderBy: { created_at: "desc" },
                skip,
                take: limitNum,
            }),
            ProviderWarrantyCustomer.count({ where }),
        ]);

        const now = new Date();
        const list = items.map((c) => {
            const wTo = c.provider_warranty_code?.warranty_to ? new Date(c.provider_warranty_code.warranty_to) : null;
            let warrantyStatus = c.provider_warranty_code?.warranty_code_status || "Active";
            if (wTo && wTo < now) warrantyStatus = "Expired";

            return {
                id: c.id,
                customerName: `${c.first_name || ""} ${c.last_name || ""}`.trim() || "N/A",
                phone: c.phone,
                email: c.email,
                serialNumber: c.serial_number || "N/A",
                productName: c.provider_warranty_code?.product_name || c.product_name || "N/A",
                warrantyCode: c.warranty_code,
                providerName: c.provider?.company_name || "N/A",
                providerEmail: c.provider?.user?.email || "",
                dealerName: c.dealer?.name || "Direct",
                warrantyFrom: c.provider_warranty_code?.warranty_from,
                warrantyTo: c.provider_warranty_code?.warranty_to,
                warrantyStatus,
                claimsCount: c.WarrantyClaim?.length || 0,
                registeredAt: c.created_at,
            };
        });

        return returnResponse(res, StatusCodes.OK, "Registered warranties retrieved", {
            items: list,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        logger.error(`warrantyRegistrationsListEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch registered warranties");
    }
};

/**
 * GET /super-admin/warranty-registrations/export
 * Export registered warranties to CSV
 */
const exportWarrantyRegistrationsCsvEndpoint = async (req, res) => {
    try {
        const { provider_id, search, date_from, date_to } = req.query;
        const where = { is_deleted: false };

        if (provider_id && typeof provider_id === "string") where.provider_id = provider_id;
        if (search && typeof search === "string") {
            const term = search.trim();
            if (term) {
                where.OR = [
                    { serial_number: { contains: term, mode: "insensitive" } },
                    { warranty_code: { contains: term, mode: "insensitive" } },
                    { first_name: { contains: term, mode: "insensitive" } },
                    { last_name: { contains: term, mode: "insensitive" } },
                    { phone: { contains: term, mode: "insensitive" } },
                    { product_name: { contains: term, mode: "insensitive" } },
                ];
            }
        }
        if (date_from || date_to) {
            where.created_at = {};
            if (date_from) where.created_at.gte = new Date(date_from);
            if (date_to) {
                const d = new Date(date_to);
                d.setHours(23, 59, 59, 999);
                where.created_at.lte = d;
            }
        }

        const items = await ProviderWarrantyCustomer.findMany({
            where,
            include: {
                provider: { select: { company_name: true, user: { select: { email: true } } } },
                dealer: { select: { name: true } },
                provider_warranty_code: {
                    select: { product_name: true, warranty_from: true, warranty_to: true, warranty_code_status: true },
                },
                WarrantyClaim: { select: { id: true } },
            },
            orderBy: { created_at: "desc" },
            take: 10000,
        });

        if (!items || items.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "No data to export. Try adjusting your filters or date range.",
            });
        }

        const now = new Date();
        const headers = [
            "Customer Name",
            "Phone",
            "Email",
            "Product",
            "Serial No",
            "Warranty Code",
            "Provider",
            "Provider Email",
            "Dealer",
            "Warranty Start",
            "Warranty End",
            "Status",
            "Claims Count",
            "Registered At",
        ];

        const rows = items.map((c) => {
            const wTo = c.provider_warranty_code?.warranty_to ? new Date(c.provider_warranty_code.warranty_to) : null;
            let status = c.provider_warranty_code?.warranty_code_status || "Active";
            if (wTo && wTo < now) status = "Expired";

            return [
                escapeCsvCell(`${c.first_name || ""} ${c.last_name || ""}`.trim() || "N/A"),
                escapeCsvCell(c.phone),
                escapeCsvCell(c.email),
                escapeCsvCell(c.provider_warranty_code?.product_name || c.product_name || "N/A"),
                escapeCsvCell(c.serial_number || ""),
                escapeCsvCell(c.warranty_code),
                escapeCsvCell(c.provider?.company_name || ""),
                escapeCsvCell(c.provider?.user?.email || ""),
                escapeCsvCell(c.dealer?.name || "Direct"),
                escapeCsvCell(c.provider_warranty_code?.warranty_from ? new Date(c.provider_warranty_code.warranty_from).toISOString().slice(0, 10) : ""),
                escapeCsvCell(c.provider_warranty_code?.warranty_to ? new Date(c.provider_warranty_code.warranty_to).toISOString().slice(0, 10) : ""),
                escapeCsvCell(status),
                escapeCsvCell(c.WarrantyClaim?.length || 0),
                escapeCsvCell(c.created_at ? new Date(c.created_at).toISOString() : ""),
            ];
        });

        const headerLine = headers.map(escapeCsvCell).join(",");
        const dataLines = rows.map((r) => r.join(","));
        const csv = [headerLine, ...dataLines].join("\n");

        const filename = `registered-warranties-${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        logger.error(`exportWarrantyRegistrationsCsvEndpoint error: ${error?.message || error}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to export registered warranties",
        });
    }
};

export { warrantyRegistrationsListEndpoint, exportWarrantyRegistrationsCsvEndpoint };
