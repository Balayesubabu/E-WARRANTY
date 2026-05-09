import PDFDocument from "pdfkit";
import { Base64Encode } from "base64-stream";

const BG_DARK = "#0f172a";
const BG_CARD = "#1e293b";
const TEXT_WHITE = "#f8fafc";
const TEXT_MUTED = "#94a3b8";
const BORDER = "#334155";
const ACCENT = "#38bdf8";

function truncate(str, maxLen = 32) {
    const s = String(str || "").trim();
    if (s.length <= maxLen) return s || "—";
    return s.slice(0, maxLen - 1) + "…";
}

/**
 * Dark Mode certificate – dark theme, white text, matches frontend Dark Mode preview.
 */
export async function renderDarkModeCertificate(data) {
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    let finalString = "";
    const stream = doc.pipe(new Base64Encode());
    stream.on("data", (chunk) => { finalString += chunk; });

    const pageW = doc.page.width - 72;
    const pageH = doc.page.height - 72;
    const left = 36;
    const centerX = left + pageW / 2;
    let y = 36;

    doc.fillColor(BG_DARK).rect(0, 0, doc.page.width, doc.page.height).fill();
    doc.strokeColor(BORDER).lineWidth(1).roundedRect(left, y, pageW, pageH, 6).stroke();
    y += 20;

    const headerH = 56;
    doc.fillColor(BG_CARD).roundedRect(left, y, pageW, headerH, 4).fill();
    doc.strokeColor(BORDER).lineWidth(0.5).roundedRect(left, y, pageW, headerH, 4).stroke();
    const headerY = y + 12;

    if (data.companyLogoBuffer) {
        try {
            doc.image(data.companyLogoBuffer, left + 16, headerY, { width: 36, height: 36 });
        } catch (_) {}
    }
    doc.fontSize(18).font("Helvetica-Bold").fillColor(TEXT_WHITE).text("WARRANTY CERTIFICATE", left + 60, headerY + 8, { width: pageW - 120, align: "center", lineBreak: false });
    doc.fontSize(9).font("Helvetica").fillColor(TEXT_MUTED).text(truncate(data.companyName || "E-Warrantify", 30), left + 60, headerY + 30, { width: pageW - 120, align: "center", lineBreak: false });
    y += headerH + 24;

    doc.fontSize(10).font("Helvetica").fillColor(TEXT_MUTED).text("This certificate is presented to", left, y, { width: pageW, align: "center", lineBreak: false });
    y += 18;
    doc.fontSize(18).font("Helvetica-Bold").fillColor(TEXT_WHITE).text(truncate(data.customerName || "—", 42), left, y, { width: pageW, align: "center", lineBreak: false });
    y += 22;
    doc.fontSize(9).font("Helvetica").fillColor(TEXT_MUTED).text("Certificate No. " + truncate(data.warrantyCode || "—", 24), left, y, { width: pageW, align: "center", lineBreak: false });
    y += 28;

    doc.fillColor(BG_CARD).roundedRect(left, y, pageW, 72, 6).fill();
    doc.strokeColor(BORDER).roundedRect(left, y, pageW, 72, 6).stroke();
    doc.fontSize(9).font("Helvetica-Bold").fillColor(TEXT_MUTED).text("PRODUCT INFORMATION", left + 20, y + 10, { lineBreak: false });
    doc.fontSize(10).font("Helvetica").fillColor(TEXT_WHITE);
    doc.text("Product: " + truncate(data.productName || "—", 36), left + 20, y + 26, { width: pageW - 40, lineBreak: false });
    doc.text("Serial No: " + truncate(data.serialNo || "—", 32), left + 20, y + 42, { width: pageW - 40, lineBreak: false });
    doc.text("Warranty Code: " + truncate(data.warrantyCode || "—", 28), left + 20, y + 58, { width: pageW - 40, lineBreak: false });
    y += 88;

    doc.fillColor(BG_CARD).roundedRect(left, y, pageW, 56, 6).fill();
    doc.strokeColor(BORDER).roundedRect(left, y, pageW, 56, 6).stroke();
    doc.fontSize(9).font("Helvetica-Bold").fillColor(TEXT_MUTED).text("WARRANTY DETAILS", left + 20, y + 10, { lineBreak: false });
    doc.fontSize(10).font("Helvetica").fillColor(TEXT_WHITE);
    doc.text("Valid from " + truncate(data.warrantyStartDate || "—", 12) + " to " + truncate(data.warrantyEndDate || "—", 12) + " - " + truncate(data.sellerName || "—", 24), left + 20, y + 28, { width: pageW - 40, lineBreak: false });
    doc.text("Seller: " + truncate(data.sellerName || "—", 42), left + 20, y + 44, { width: pageW - 40, lineBreak: false });
    y += 72;

    doc.fillColor(BG_CARD).roundedRect(left, y, pageW, 40, 6).fill();
    doc.strokeColor(BORDER).roundedRect(left, y, pageW, 40, 6).stroke();
    doc.fontSize(9).font("Helvetica-Bold").fillColor(TEXT_MUTED).text("OWNER INFORMATION", left + 20, y + 10, { lineBreak: false });
    doc.fontSize(10).font("Helvetica").fillColor(TEXT_WHITE).text(truncate(data.customerName || "—", 30) + " - " + truncate(data.phone || "—", 18), left + 20, y + 26, { width: pageW - 40, lineBreak: false });
    y += 52;

    const botY = doc.page.height - 60;
    doc.strokeColor(BORDER).lineWidth(0.5).moveTo(left, botY).lineTo(left + pageW, botY).stroke();
    if (data.signatureBuffer) {
        try {
            doc.image(data.signatureBuffer, left, botY + 8, { width: 80, height: 28 });
            doc.fontSize(7).font("Helvetica").fillColor(TEXT_MUTED).text("Authorized Representative", left, botY + 42, { lineBreak: false });
        } catch (_) {}
    }
    doc.fontSize(7).font("Helvetica").fillColor(TEXT_MUTED).text("Powered by E-Warrantify", left, botY + 8, { width: pageW, align: "right", lineBreak: false });
    if (data.qrCodeBuffer) {
        try {
            doc.image(data.qrCodeBuffer, left + pageW - 44, botY + 4, { width: 40, height: 40 });
        } catch (_) {}
    }

    doc.end();
    return new Promise((resolve, reject) => {
        stream.on("end", () => resolve(finalString));
        stream.on("error", reject);
    });
}
