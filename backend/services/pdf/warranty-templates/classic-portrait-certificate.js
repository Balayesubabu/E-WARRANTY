import PDFDocument from "pdfkit";
import { Base64Encode } from "base64-stream";

function truncate(str, maxLen = 36) {
    const s = String(str ?? "").trim();
    if (s.length <= maxLen) return s || "—";
    return s.slice(0, maxLen - 1) + "…";
}

const NO_WRAP = { lineBreak: false };

/**
 * Classic Portrait – vertical format, same data as classic but portrait layout.
 */
export async function renderClassicPortraitCertificate(data) {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    let finalString = "";
    const stream = doc.pipe(new Base64Encode());
    stream.on("data", (chunk) => { finalString += chunk; });

    const w = doc.page.width - 80;
    const left = 40;
    let y = 40;

    doc.fontSize(20).font("Helvetica-Bold").fillColor("#111827").text("Warranty Certificate", left, y, { width: w, align: "center", ...NO_WRAP });
    y += 28;
    if (data.companyLogoBuffer) {
        try {
            doc.image(data.companyLogoBuffer, left + w / 2 - 45, y, { width: 90, height: 50 });
            y += 60;
        } catch (_) {
            y += 10;
        }
    } else if (data.companyName) {
        doc.fontSize(10).font("Helvetica").fillColor("#64748b").text(truncate(data.companyName, 50), left, y, { width: w, align: "center", ...NO_WRAP });
        y += 22;
    }

    const line = (label, value) => {
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b").text(label, left, y, { width: 140, ...NO_WRAP });
        doc.fontSize(10).font("Helvetica").fillColor("#0f172a").text(truncate(value, 38), left + 145, y - 1, { width: w - 150, ...NO_WRAP });
        y += 22;
    };

    line("Customer Name:", data.customerName || "—");
    line("Product:", data.productName || "—");
    line("Serial Number:", data.serialNo || "—");
    line("Item Code:", data.itemCode || "—");
    line("Warranty ID:", data.warrantyCode || "—");
    line("Warranty Start:", data.warrantyStartDate || "—");
    line("Valid Until:", data.warrantyEndDate || "—");
    line("Dealer / Seller:", data.sellerName || data.instNameDealer || "—");
    line("Installation / DOP:", data.dopInstallation || "—");
    line("Invoice Number:", data.invoiceNumber || "—");
    line("Customer Phone:", data.phone || "—");
    if (data.custom_field_name1) line(data.custom_field_name1 + ":", data.custom_field_value1 || "—");
    if (data.custom_field_name2) line(data.custom_field_name2 + ":", data.custom_field_value2 || "—");

    y += 16;
    if (data.terms_and_conditions_link) {
        doc.fontSize(8).font("Helvetica").fillColor("#1A7FC1").text("Terms: " + truncate(data.terms_and_conditions_link, 55), left, y, { width: w, link: data.terms_and_conditions_link, ...NO_WRAP });
        y += 18;
    }

    const botY = doc.page.height - 80;
    doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(left, botY - 10).lineTo(left + w, botY - 10).stroke();
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
    doc.fontSize(7).fillColor("#94a3b8").text("Powered by E-Warrantify", left, botY + 40, { width: w, align: "center", ...NO_WRAP });

    doc.end();
    return new Promise((resolve, reject) => {
        stream.on("end", () => resolve(finalString));
        stream.on("error", reject);
    });
}
