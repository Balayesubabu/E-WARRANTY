import PDFDocument from "pdfkit";
import { Base64Encode } from "base64-stream";

function truncate(str, maxLen = 36) {
    const s = String(str ?? "").trim();
    if (s.length <= maxLen) return s || "—";
    return s.slice(0, maxLen - 1) + "…";
}

const NO_WRAP = { lineBreak: false };

/**
 * Gradient Header – bold blue gradient header with professional look.
 */
export async function renderGradientHeaderCertificate(data) {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    let finalString = "";
    const stream = doc.pipe(new Base64Encode());
    stream.on("data", (chunk) => { finalString += chunk; });

    const w = doc.page.width - 80;
    const left = 40;
    let y = 40;

    doc.fillColor("#1A7FC1").rect(0, 0, doc.page.width, 100).fill();
    doc.fillColor("#0D5A8A").rect(0, 0, doc.page.width, 40).fill();
    if (data.companyLogoBuffer) {
        try {
            doc.image(data.companyLogoBuffer, left, 25, { width: 50, height: 40 });
        } catch (_) {}
    }
    doc.fontSize(22).font("Helvetica-Bold").fillColor("#ffffff").text("Warranty Certificate", left + 60, 35, { width: w - 60, lineBreak: false });
    doc.fontSize(10).font("Helvetica").fillColor("#bae6fd").text(truncate(data.companyName || "", 40), left + 60, 62, { width: w - 60, ...NO_WRAP });
    y = 115;

    doc.fontSize(10).font("Helvetica").fillColor("#64748b").text("This certificate is presented to", left, y, { width: w, align: "center", ...NO_WRAP });
    y += 18;
    doc.fontSize(18).font("Helvetica-Bold").fillColor("#0f172a").text(truncate(data.customerName || "—", 42), left, y, { width: w, align: "center", ...NO_WRAP });
    y += 28;

    doc.fillColor("#f0f9ff").roundedRect(left, y, w, 90, 6).fill();
    doc.strokeColor("#7dd3fc").roundedRect(left, y, w, 90, 6).stroke();
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#0369a1").text("PRODUCT & WARRANTY DETAILS", left + 16, y + 12, NO_WRAP);
    doc.fontSize(10).font("Helvetica").fillColor("#0f172a");
    doc.text("Product: " + truncate(data.productName || "—", 38) + "   Serial: " + truncate(data.serialNo || "—", 24), left + 16, y + 28, { width: w - 32, ...NO_WRAP });
    doc.text("Item Code: " + truncate(data.itemCode || "—", 32) + "   Warranty ID: " + truncate(data.warrantyCode || "—", 22), left + 16, y + 46, { width: w - 32, ...NO_WRAP });
    doc.text("Valid: " + truncate(data.warrantyStartDate || "—", 12) + " to " + truncate(data.warrantyEndDate || "—", 12), left + 16, y + 64, { width: w - 32, ...NO_WRAP });
    doc.text("Seller: " + truncate(data.sellerName || "—", 50) + "   Phone: " + truncate(data.phone || "—", 16), left + 16, y + 82, { width: w - 32, ...NO_WRAP });
    y += 105;

    doc.fillColor("#f0f9ff").roundedRect(left, y, w, 50, 6).fill();
    doc.strokeColor("#7dd3fc").roundedRect(left, y, w, 50, 6).stroke();
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#0369a1").text("ADDITIONAL INFO", left + 16, y + 10, NO_WRAP);
    doc.fontSize(10).font("Helvetica").fillColor("#0f172a");
    doc.text("Installation: " + truncate(data.dopInstallation || "—", 16) + "   Invoice: " + truncate(data.invoiceNumber || "—", 20), left + 16, y + 28, { width: w - 32, ...NO_WRAP });
    if (data.custom_field_name1) doc.text(truncate(data.custom_field_name1, 16) + ": " + truncate(data.custom_field_value1, 24), left + 16, y + 44, { width: w - 32, ...NO_WRAP });
    y += 65;

    const botY = doc.page.height - 70;
    if (data.signatureBuffer) {
        try {
            doc.image(data.signatureBuffer, left, botY, { width: 90, height: 32 });
            doc.fontSize(8).font("Helvetica").fillColor("#64748b").text("Authorized Representative", left, botY + 36, NO_WRAP);
        } catch (_) {}
    }
    if (data.qrCodeBuffer) {
        try {
            doc.image(data.qrCodeBuffer, left + w - 48, botY, { width: 48, height: 48 });
        } catch (_) {}
    }
    doc.fontSize(7).fillColor("#94a3b8").text("Powered by E-Warrantify", left, botY + 45, { width: w, align: "center", ...NO_WRAP });

    doc.end();
    return new Promise((resolve, reject) => {
        stream.on("end", () => resolve(finalString));
        stream.on("error", reject);
    });
}
