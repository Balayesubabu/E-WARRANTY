import { logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { ProviderProductWarrantyCode } from "../../../prisma/db-models.js";

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
 * GET /super-admin/warranty-codes/export
 * Export generated warranty codes to CSV. Uses same filters as list: provider_id, search, date_from, date_to
 */
const exportWarrantyCodesCsvEndpoint = async (req, res) => {
    try {
        const { provider_id, search, date_from, date_to } = req.query;
        const where = { is_deleted: false };

        if (provider_id && typeof provider_id === "string") {
            where.provider_id = provider_id;
        }
        if (search && typeof search === "string") {
            const term = search.trim();
            if (term) {
                where.OR = [
                    { warranty_code: { contains: term, mode: "insensitive" } },
                    { product_name: { contains: term, mode: "insensitive" } },
                    { serial_no: { contains: term, mode: "insensitive" } },
                    { sequence_no: { contains: term, mode: "insensitive" } },
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

        const codes = await ProviderProductWarrantyCode.findMany({
            where,
            include: {
                provider: {
                    select: { company_name: true, user: { select: { email: true } } },
                },
            },
            orderBy: { created_at: "desc" },
            take: 10000,
        });

        if (!codes || codes.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "No data to export. Try adjusting your filters or date range.",
            });
        }

        const headers = [
            "Warranty Code",
            "Product Name",
            "Serial No",
            "Sequence No",
            "Status",
            "Provider",
            "Provider Email",
            "Created At",
        ];
        const rows = codes.map((c) => [
            escapeCsvCell(c.warranty_code),
            escapeCsvCell(c.product_name),
            escapeCsvCell(c.serial_no),
            escapeCsvCell(c.sequence_no),
            escapeCsvCell(c.warranty_code_status),
            escapeCsvCell(c.provider?.company_name),
            escapeCsvCell(c.provider?.user?.email),
            escapeCsvCell(c.created_at ? new Date(c.created_at).toISOString() : ""),
        ]);

        const headerLine = headers.map(escapeCsvCell).join(",");
        const dataLines = rows.map((r) => r.join(","));
        const csv = [headerLine, ...dataLines].join("\n");

        const filename = `warranty-codes-${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        logger.error(`exportWarrantyCodesCsvEndpoint error: ${error?.message || error}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to export warranty codes",
        });
    }
};

export default exportWarrantyCodesCsvEndpoint;
