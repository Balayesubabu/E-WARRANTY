import PDFDocument from "pdfkit";
import { Base64Encode } from "base64-stream";

/** Truncate to one line so PDF never wraps (avoids extra pages). */
function truncate(str, maxLen = 32) {
    const s = String(str ?? "").trim();
    if (s.length <= maxLen) return s || "—";
    return s.slice(0, maxLen - 1) + "…";
}

const NO_WRAP = { lineBreak: false };

/**
 * Minimal warranty certificate – single column, one page only.
 * All text uses lineBreak: false and truncation so PDFKit never adds pages.
 */
export async function renderMinimalCertificate(data) {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    let finalString = "";
    const stream = doc.pipe(new Base64Encode());
    stream.on("data", (chunk) => { finalString += chunk; });

    const w = doc.page.width - 100;
    const left = 50;
    let y = 50;

    doc.fontSize(18).font("Helvetica-Bold").text("Warranty Certificate", left, y, { width: w, align: "center", ...NO_WRAP });
    y += 28;
    if (data.companyName) {
        doc.fontSize(10).font("Helvetica").fillColor("#64748b").text(truncate(data.companyName, 50), left, y, { width: w, align: "center", ...NO_WRAP });
        y += 22;
    } else {
        y += 12;
    }

    const line = (label, value) => {
        doc.fontSize(10).font("Helvetica").fillColor("#0f172a");
        doc.text(truncate(label, 24) + "  " + truncate(value, 40), left, y, { width: w, ...NO_WRAP });
        y += 20;
    };

    line("Customer name:", data.customerName);
    line("Product:", data.productName);
    line("Warranty ID:", data.warrantyCode);
    line("Serial no:", data.serialNo);
    line("Item code:", data.itemCode);
    line("Start date:", data.warrantyStartDate);
    line("End date:", data.warrantyEndDate);
    line("Seller / Dealer:", data.sellerName);
    line("Installation date:", data.dopInstallation);
    line("Phone:", data.phone);
    line("Invoice no:", data.invoiceNumber);
    if (data.custom_field_name1) line(data.custom_field_name1 + ":", data.custom_field_value1);
    if (data.custom_field_name2) line(data.custom_field_name2 + ":", data.custom_field_value2);

    y += 10;
    if (data.terms_and_conditions) {
        const termsStr = Array.isArray(data.terms_and_conditions) ? data.terms_and_conditions.join(" ") : String(data.terms_and_conditions);
        doc.fontSize(9).fillColor("#64748b").text("Terms: " + truncate(termsStr, 80), left, y, { width: w, ...NO_WRAP });
    }

    // Signature and QR code at bottom
    const botY = doc.page.height - 75;
    if (data.signatureBuffer) {
        try {
            doc.image(data.signatureBuffer, left, botY, { width: 100, height: 36 });
            doc.fontSize(8).font("Helvetica").fillColor("#64748b").text("Authorized Representative", left, botY + 40, NO_WRAP);
        } catch (_) {}
    }
    if (data.qrCodeBuffer) {
        try {
            doc.image(data.qrCodeBuffer, left + w - 48, botY, { width: 48, height: 48 });
        } catch (_) {}
    }

    doc.end();
    return new Promise((resolve, reject) => {
        stream.on("end", () => resolve(finalString));
        stream.on("error", reject);
    });
}
