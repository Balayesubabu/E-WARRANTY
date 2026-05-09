import PDFDocument from "pdfkit";
import { Base64Encode } from "base64-stream";

function truncate(str, maxLen = 28) {
    const s = String(str ?? "").trim();
    if (s.length <= maxLen) return s || "—";
    return s.slice(0, maxLen - 1) + "…";
}

const NO_WRAP = { lineBreak: false };

/**
 * Compact Print – space-efficient, small fonts, fits more on one page.
 */
export async function renderCompactPrintCertificate(data) {
    const doc = new PDFDocument({ size: "A4", margin: 32 });
    let finalString = "";
    const stream = doc.pipe(new Base64Encode());
    stream.on("data", (chunk) => { finalString += chunk; });

    const w = doc.page.width - 64;
    const left = 32;
    let y = 28;

    doc.fontSize(14).font("Helvetica-Bold").fillColor("#1A7FC1").text("Warranty Certificate", left, y, { width: w, align: "center", ...NO_WRAP });
    y += 18;
    if (data.companyName) doc.fontSize(8).font("Helvetica").fillColor("#64748b").text(truncate(data.companyName, 45), left, y, { width: w, align: "center", ...NO_WRAP });
    y += 14;

    const line = (label, value) => {
        doc.fontSize(8).font("Helvetica-Bold").fillColor("#374151").text(label + ":", left, y, { width: 100, ...NO_WRAP });
        doc.fontSize(8).font("Helvetica").fillColor("#111827").text(truncate(value, 36), left + 105, y - 1, { width: w - 115, ...NO_WRAP });
        y += 14;
    };

    line("Customer", data.customerName);
    line("Product", data.productName);
    line("Serial No", data.serialNo);
    line("Item Code", data.itemCode);
    line("Warranty ID", data.warrantyCode);
    line("Start", data.warrantyStartDate);
    line("End", data.warrantyEndDate);
    line("Seller", data.sellerName || data.instNameDealer);
    line("DOP", data.dopInstallation);
    line("Invoice", data.invoiceNumber);
    line("Phone", data.phone);
    if (data.custom_field_name1) line(data.custom_field_name1, data.custom_field_value1);
    if (data.custom_field_name2) line(data.custom_field_name2, data.custom_field_value2);

    y += 8;
    const botY = doc.page.height - 55;
    if (data.signatureBuffer) {
        try {
            doc.image(data.signatureBuffer, left, botY, { width: 70, height: 25 });
            doc.fontSize(6).font("Helvetica").fillColor("#64748b").text("Authorized Rep.", left, botY + 28, NO_WRAP);
        } catch (_) {}
    }
    if (data.qrCodeBuffer) {
        try {
            doc.image(data.qrCodeBuffer, left + w - 40, botY, { width: 40, height: 40 });
        } catch (_) {}
    }
    doc.fontSize(6).fillColor("#94a3b8").text("Powered by E-Warrantify", left, botY + 38, { width: w, align: "center", ...NO_WRAP });

    doc.end();
    return new Promise((resolve, reject) => {
        stream.on("end", () => resolve(finalString));
        stream.on("error", reject);
    });
}
