import PDFDocument from "pdfkit";
import { Base64Encode } from "base64-stream";

/** Truncate to one line so PDF never wraps (avoids extra pages). */
function truncate(str, maxLen = 36) {
    const s = String(str ?? "").trim();
    if (s.length <= maxLen) return s || "—";
    return s.slice(0, maxLen - 1) + "…";
}

const NO_WRAP = { lineBreak: false };

/**
 * Modern warranty certificate – portrait A4, one page only.
 * All text uses lineBreak: false and truncation so PDFKit never adds pages.
 */
export async function renderModernCertificate(data) {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    let finalString = "";
    const stream = doc.pipe(new Base64Encode());
    stream.on("data", (chunk) => { finalString += chunk; });

    const w = doc.page.width - 80;
    let y = 40;

    if (data.companyLogoBuffer) {
        doc.image(data.companyLogoBuffer, 40, y, { width: 80, height: 60 });
    }
    doc.fontSize(22).font("Helvetica-Bold").fillColor("#1A7FC1").text("Warranty Certificate", 40, data.companyLogoBuffer ? y + 70 : y, { width: w, lineBreak: false });
    y = data.companyLogoBuffer ? y + 100 : y + 45;

    doc.moveTo(40, y).lineTo(w + 40, y).stroke("#1A7FC1").lineWidth(2);
    y += 24;

    if (data.companyName) {
        doc.fontSize(10).font("Helvetica").fillColor("#64748b").text(truncate(data.companyName, 50), 40, y, { width: w, ...NO_WRAP });
        y += 18;
    }

    doc.fillColor("#f8fafc").roundedRect(40, y, w, 100, 6).fill();
    doc.strokeColor("#e2e8f0").roundedRect(40, y, w, 100, 6).stroke();
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b").text("CUSTOMER & PRODUCT", 52, y + 12, NO_WRAP);
    doc.fontSize(10).font("Helvetica").fillColor("#0f172a");
    doc.text("Customer: " + truncate(data.customerName, 42), 52, y + 28, { width: w - 24, ...NO_WRAP });
    doc.text("Product: " + truncate(data.productName, 42), 52, y + 44, { width: w - 24, ...NO_WRAP });
    doc.text("Serial No: " + truncate(data.serialNo, 38), 52, y + 60, { width: w - 24, ...NO_WRAP });
    doc.text("Item Code: " + truncate(data.itemCode, 38), 52, y + 76, { width: w - 24, ...NO_WRAP });
    y += 115;

    doc.fillColor("#f8fafc").roundedRect(40, y, w, 88, 6).fill();
    doc.strokeColor("#e2e8f0").roundedRect(40, y, w, 88, 6).stroke();
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b").text("WARRANTY DETAILS", 52, y + 12, NO_WRAP);
    doc.fontSize(10).font("Helvetica").fillColor("#0f172a");
    doc.text("Warranty ID: " + truncate(data.warrantyCode, 36), 52, y + 28, { width: w - 24, ...NO_WRAP });
    doc.text("Start: " + truncate(data.warrantyStartDate, 12) + "  •  End: " + truncate(data.warrantyEndDate, 12), 52, y + 44, { width: w - 24, ...NO_WRAP });
    doc.text("Seller: " + truncate(data.sellerName, 42), 52, y + 60, { width: w - 24, ...NO_WRAP });
    doc.text("Invoice: " + truncate(data.invoiceNumber, 20) + "  •  Phone: " + truncate(data.phone, 18), 52, y + 76, { width: w - 24, ...NO_WRAP });
    y += 102;

    if (data.custom_field_name1 || data.custom_field_name2) {
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b").text("ADDITIONAL INFO", 40, y + 6, NO_WRAP);
        y += 20;
        doc.fontSize(10).font("Helvetica").fillColor("#0f172a");
        if (data.custom_field_name1) doc.text(truncate(data.custom_field_name1, 18) + ": " + truncate(data.custom_field_value1, 24), 40, y, { width: w, ...NO_WRAP });
        if (data.custom_field_name2) doc.text(truncate(data.custom_field_name2, 18) + ": " + truncate(data.custom_field_value2, 24), 40, y + 16, { width: w, ...NO_WRAP });
        y += 36;
    }

    if (data.terms_and_conditions) {
        const termsStr = Array.isArray(data.terms_and_conditions) ? data.terms_and_conditions.join(" ") : String(data.terms_and_conditions);
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b").text("Terms and Conditions", 40, y + 8, NO_WRAP);
        doc.fontSize(8).fillColor("#64748b").text(truncate(termsStr, 100), 40, y + 24, { width: w, ...NO_WRAP });
    }

    // Signature and QR code at bottom
    const botY = doc.page.height - 80;
    if (data.signatureBuffer) {
        try {
            doc.image(data.signatureBuffer, 40, botY, { width: 100, height: 36 });
            doc.fontSize(8).font("Helvetica").fillColor("#64748b").text("Authorized Representative", 40, botY + 40, NO_WRAP);
        } catch (_) {}
    }
    if (data.qrCodeBuffer) {
        try {
            doc.image(data.qrCodeBuffer, 40 + w - 48, botY, { width: 48, height: 48 });
        } catch (_) {}
    }

    doc.end();
    return new Promise((resolve, reject) => {
        stream.on("end", () => resolve(finalString));
        stream.on("error", reject);
    });
}
