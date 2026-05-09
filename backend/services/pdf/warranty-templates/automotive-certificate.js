import PDFDocument from "pdfkit";
import { Base64Encode } from "base64-stream";

const SLATE = "#0f172a";
const AMBER = "#d97706";
const AMBER_LIGHT = "#fbbf24";

function truncate(str, maxLen = 32) {
    const s = String(str ?? "").trim();
    if (s.length <= maxLen) return s || "—";
    return s.slice(0, maxLen - 1) + "…";
}

/**
 * Automotive – slate header, amber accents, tailored for auto parts.
 */
export async function renderAutomotiveCertificate(data) {
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    let finalString = "";
    const stream = doc.pipe(new Base64Encode());
    stream.on("data", (chunk) => { finalString += chunk; });

    const pageW = doc.page.width - 72;
    const left = 36;
    const centerX = left + pageW / 2;
    let y = 36;

    doc.strokeColor(AMBER).lineWidth(2).roundedRect(left, y, pageW, doc.page.height - 72, 4).stroke();
    doc.strokeColor("#e2e8f0").lineWidth(0.5).roundedRect(left + 4, y + 4, pageW - 8, doc.page.height - 80, 2).stroke();
    y += 20;

    doc.fillColor(SLATE).rect(left, y, pageW, 48).fill();
    doc.strokeColor(AMBER).lineWidth(1).moveTo(left, y + 48).lineTo(left + pageW, y + 48).stroke();
    doc.fontSize(18).font("Helvetica-Bold").fillColor(AMBER_LIGHT).text("WARRANTY CERTIFICATE", left, y + 12, { width: pageW, align: "center", lineBreak: false });
    doc.fontSize(9).font("Helvetica").fillColor("#94a3b8").text(truncate(data.companyName || "E-Warrantify", 40), left, y + 34, { width: pageW, align: "center", lineBreak: false });
    if (data.companyLogoBuffer) {
        try {
            doc.image(data.companyLogoBuffer, left + 16, y + 4, { width: 40, height: 40 });
        } catch (_) {}
    }
    y += 58;

    doc.fontSize(10).font("Helvetica").fillColor("#64748b").text("This is to certify that", left, y, { width: pageW, align: "center", lineBreak: false });
    y += 18;
    doc.fontSize(18).font("Helvetica-Bold").fillColor("#0f172a").text(truncate(data.customerName || "—", 42), left, y, { width: pageW, align: "center", lineBreak: false });
    y += 24;
    doc.fontSize(10).font("Helvetica").fillColor("#64748b").text("has purchased the following product with a valid warranty period.", left, y, { width: pageW, align: "center", lineBreak: false });
    y += 26;

    doc.fillColor("#fef3c7").roundedRect(left, y, pageW, 95, 6).fill();
    doc.strokeColor(AMBER).lineWidth(0.8).roundedRect(left, y, pageW, 95, 6).stroke();
    const col2 = left + pageW / 2 + 12;
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#92400e");
    doc.text("Product", left + 16, y + 10, { lineBreak: false });
    doc.text("Serial No", left + 16, y + 26, { lineBreak: false });
    doc.text("Item Code", left + 16, y + 42, { lineBreak: false });
    doc.text("Warranty ID", col2, y + 10, { lineBreak: false });
    doc.text("Valid Until", col2, y + 26, { lineBreak: false });
    doc.text("Dealer / Seller", col2, y + 42, { lineBreak: false });
    doc.fontSize(9).font("Helvetica").fillColor("#1e293b");
    doc.text(truncate(data.productName || "—", 28), left + 95, y + 8, { width: pageW / 2 - 115, lineBreak: false });
    doc.text(truncate(data.serialNo || "—", 28), left + 95, y + 24, { width: pageW / 2 - 115, lineBreak: false });
    doc.text(truncate(data.itemCode || "—", 28), left + 95, y + 40, { width: pageW / 2 - 115, lineBreak: false });
    doc.text(truncate(data.warrantyCode || "—", 24), col2 + 65, y + 8, { width: pageW / 2 - 90, lineBreak: false });
    doc.text(truncate(data.warrantyEndDate || "—", 16), col2 + 65, y + 24, { width: pageW / 2 - 90, lineBreak: false });
    doc.text(truncate(data.sellerName || "—", 28), col2 + 65, y + 40, { width: pageW / 2 - 90, lineBreak: false });
    doc.text("Start: " + truncate(data.warrantyStartDate || "—", 14) + "   Phone: " + truncate(data.phone || "—", 16), left + 16, y + 58, { lineBreak: false });
    doc.text("DOP: " + truncate(data.dopInstallation || "—", 16) + "   Invoice: " + truncate(data.invoiceNumber || "—", 18), left + 16, y + 74, { lineBreak: false });
    y += 108;

    const botY = doc.page.height - 55;
    doc.strokeColor(AMBER).lineWidth(0.5).moveTo(left, botY).lineTo(left + pageW, botY).stroke();
    if (data.signatureBuffer) {
        try {
            doc.image(data.signatureBuffer, left, botY + 8, { width: 80, height: 28 });
            doc.fontSize(7).font("Helvetica").fillColor("#64748b").text("Authorized Representative", left, botY + 40, { lineBreak: false });
        } catch (_) {}
    }
    doc.fontSize(7).fillColor("#94a3b8").text("Powered by E-Warrantify", left, botY + 12, { width: pageW, align: "center", lineBreak: false });
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
