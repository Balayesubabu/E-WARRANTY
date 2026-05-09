import PDFDocument from "pdfkit";
import { Base64Encode } from "base64-stream";

function truncate(str, maxLen = 32) {
    const s = String(str ?? "").trim();
    if (s.length <= maxLen) return s || "—";
    return s.slice(0, maxLen - 1) + "…";
}

/**
 * Watermark Corporate – slate/grey theme with subtle corporate feel.
 */
export async function renderWatermarkCorporateCertificate(data) {
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    let finalString = "";
    const stream = doc.pipe(new Base64Encode());
    stream.on("data", (chunk) => { finalString += chunk; });

    const pageW = doc.page.width - 72;
    const left = 36;
    const centerX = left + pageW / 2;
    let y = 36;

    doc.fillColor("#f8fafc").rect(0, 0, doc.page.width, doc.page.height).fill();
    doc.opacity(0.06).fontSize(80).font("Helvetica-Bold").fillColor("#334155").text("WARRANTY", centerX - 120, doc.page.height / 2 - 50, { width: 240, align: "center" });
    doc.opacity(1);

    doc.fillColor("#334155").rect(left, y, pageW, 50).fill();
    if (data.companyLogoBuffer) {
        try {
            doc.image(data.companyLogoBuffer, left + 16, y + 5, { width: 40, height: 40 });
        } catch (_) {}
    }
    doc.fontSize(16).font("Helvetica-Bold").fillColor("#ffffff").text("WARRANTY CERTIFICATE", left + 70, y + 12, { width: pageW - 90, lineBreak: false });
    doc.fontSize(9).font("Helvetica").fillColor("#cbd5e1").text(truncate(data.companyName || "E-Warrantify", 40), left + 70, y + 34, { width: pageW - 90, lineBreak: false });
    y += 58;

    doc.fontSize(10).font("Helvetica").fillColor("#64748b").text("This is to certify that", left, y, { width: pageW, align: "center", lineBreak: false });
    y += 18;
    doc.fontSize(18).font("Helvetica-Bold").fillColor("#1e293b").text(truncate(data.customerName || "—", 42), left, y, { width: pageW, align: "center", lineBreak: false });
    y += 24;
    doc.fontSize(10).font("Helvetica").fillColor("#64748b").text("has purchased the following product with a valid warranty period.", left, y, { width: pageW, align: "center", lineBreak: false });
    y += 28;

    doc.fillColor("#f1f5f9").roundedRect(left, y, pageW, 100, 6).fill();
    doc.strokeColor("#e2e8f0").roundedRect(left, y, pageW, 100, 6).stroke();
    const col2 = left + pageW / 2 + 16;
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#64748b");
    doc.text("Product", left + 16, y + 12, { lineBreak: false });
    doc.text("Serial No", left + 16, y + 30, { lineBreak: false });
    doc.text("Item Code", left + 16, y + 48, { lineBreak: false });
    doc.text("Warranty ID", col2, y + 12, { lineBreak: false });
    doc.text("Valid Until", col2, y + 30, { lineBreak: false });
    doc.text("Seller", col2, y + 48, { lineBreak: false });
    doc.fontSize(10).font("Helvetica").fillColor("#1e293b");
    doc.text(truncate(data.productName || "—", 28), left + 100, y + 10, { width: pageW / 2 - 120, lineBreak: false });
    doc.text(truncate(data.serialNo || "—", 28), left + 100, y + 28, { width: pageW / 2 - 120, lineBreak: false });
    doc.text(truncate(data.itemCode || "—", 28), left + 100, y + 46, { width: pageW / 2 - 120, lineBreak: false });
    doc.text(truncate(data.warrantyCode || "—", 24), col2 + 60, y + 10, { width: pageW / 2 - 90, lineBreak: false });
    doc.text(truncate(data.warrantyEndDate || "—", 16), col2 + 60, y + 28, { width: pageW / 2 - 90, lineBreak: false });
    doc.text(truncate(data.sellerName || "—", 28), col2 + 60, y + 46, { width: pageW / 2 - 90, lineBreak: false });
    doc.text("Start: " + truncate(data.warrantyStartDate || "—", 14), left + 16, y + 68, { lineBreak: false });
    doc.text("Phone: " + truncate(data.phone || "—", 18), col2, y + 68, { lineBreak: false });
    y += 115;

    const botY = doc.page.height - 50;
    if (data.signatureBuffer) {
        try {
            doc.image(data.signatureBuffer, left, botY - 40, { width: 80, height: 28 });
            doc.fontSize(7).font("Helvetica").fillColor("#64748b").text("Authorized Representative", left, botY - 8, { lineBreak: false });
        } catch (_) {}
    }
    doc.fontSize(7).fillColor("#94a3b8").text("Powered by E-Warrantify", left, botY - 5, { width: pageW, align: "center", lineBreak: false });
    if (data.qrCodeBuffer) {
        try {
            doc.image(data.qrCodeBuffer, left + pageW - 44, botY - 44, { width: 40, height: 40 });
        } catch (_) {}
    }

    doc.end();
    return new Promise((resolve, reject) => {
        stream.on("end", () => resolve(finalString));
        stream.on("error", reject);
    });
}
