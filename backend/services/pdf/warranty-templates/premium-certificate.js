import PDFDocument from "pdfkit";
import { Base64Encode } from "base64-stream";

// Design colors matching the premium certificate (deep blue, gold, light blue)
const DEEP_BLUE = "#1e3a5f";
const DEEP_BLUE_DARK = "#0f172a";
const GOLD = "#b8860b";
const GOLD_LIGHT = "#d4af37";
const LIGHT_BLUE_BG = "#e0f2fe";
const LIGHT_BLUE_BORDER = "#7dd3fc";
const TEXT_DARK = "#1e3a5f";
const TEXT_MUTED = "#64748b";
const BORDER_GOLD = "#c9a227";
const WHITE = "#ffffff";

/** Truncate string to one line for PDF (prevents wrap → extra pages). */
function truncate(str, maxLen = 32) {
    const s = String(str || "").trim();
    if (s.length <= maxLen) return s || "—";
    return s.slice(0, maxLen - 1) + "…";
}

/**
 * Premium warranty certificate – matches the E-Warrantify-style design:
 * Wave header with logo and gold title, "This is to certify that" + prominent customer name,
 * single product-details table, thank-you message, warranty seal, signature block, contact.
 * Same data shape as classic/modern/minimal. No flow changes.
 * @param {Object} data - Warranty and provider data (customerName, productName, serialNo, sellerName, warrantyEndDate, etc.)
 * @returns {Promise<string>} Base64 PDF
 */
export async function renderPremiumCertificate(data) {
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    let finalString = "";
    const stream = doc.pipe(new Base64Encode());
    stream.on("data", (chunk) => { finalString += chunk; });

    // Capture page size once (never use doc.page again – avoids blank extra pages)
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const pageW = pageWidth - 72;
    const pageH = pageHeight - 72;
    const left = 36;
    const centerX = left + pageW / 2;
    let y = 36;

    // ----- Ornate outer border (double line, gold inner) -----
    doc.strokeColor(BORDER_GOLD).lineWidth(1.2).roundedRect(left, y, pageW, pageH, 6).stroke();
    doc.strokeColor("#e2e8f0").lineWidth(0.5).roundedRect(left + 4, y + 4, pageW - 8, pageH - 8, 4).stroke();
    y += 16;

    // ----- Header: deep blue, straight bottom edge (no zig-zag) -----
    const headerH = 70;
    doc.fillColor(DEEP_BLUE_DARK).rect(left, y, pageW, 8).fill();
    doc.fillColor(DEEP_BLUE).rect(left, y + 8, pageW, headerH - 8).fill();

    const headerY = y + 12;

    // Company logo (left) or initials badge when no logo
    if (data.companyLogoBuffer) {
        try {
            doc.image(data.companyLogoBuffer, left + 16, headerY + 2, { width: 44, height: 44 });
        } catch (_) {}
    } else {
        const name = (data.companyName || "W").trim();
        const initials = name.split(/\s+/).map((s) => s[0]).join("").toUpperCase().slice(0, 2) || "W";
        doc.fillColor(DEEP_BLUE_DARK).roundedRect(left + 16, headerY + 2, 44, 44, 6).fill();
        doc.strokeColor(GOLD_LIGHT).lineWidth(1).roundedRect(left + 16, headerY + 2, 44, 44, 6).stroke();
        doc.fontSize(18).font("Helvetica-Bold").fillColor(WHITE).text(initials, left + 16, headerY + 12, { width: 44, align: "center", lineBreak: false });
    }

    // Gold shield (circle with check) – center
    doc.fillColor(GOLD_LIGHT).circle(centerX, headerY + 24, 16).fill();
    doc.strokeColor(GOLD).lineWidth(1).circle(centerX, headerY + 24, 16).stroke();
    doc.fontSize(12).font("Helvetica-Bold").fillColor(WHITE).text("✓", centerX - 4, headerY + 17, { width: 10, align: "center", lineBreak: false });

    // Company name under shield (one line)
    const brandName = truncate(data.companyName || "E-Warrantify", 18);
    doc.fontSize(10).font("Helvetica-Bold").fillColor(WHITE).text(brandName, centerX - 55, headerY + 34, { width: 110, align: "center", lineBreak: false });

    // "WARRANTY CERTIFICATE" in gold – one line, no decorative lines
    y += headerH;
    const titleY = y + 14;
    doc.fontSize(18).font("Helvetica-Bold").fillColor(GOLD_LIGHT).text("WARRANTY CERTIFICATE", left, titleY, { width: pageW, align: "center", lineBreak: false });

    y += 36;

    // ----- Main content area with ornate inner frame -----
    doc.strokeColor(BORDER_GOLD).lineWidth(0.6).roundedRect(left + 12, y, pageW - 24, pageH - (y - 36) - 120, 4).stroke();

    y += 24;

    // "This is to certify that"
    doc.fontSize(11).font("Helvetica").fillColor(TEXT_MUTED).text("This is to certify that", left + 24, y, { width: pageW - 48, align: "center", lineBreak: false });
    y += 22;

    // Customer name – one line, no wrap (prevents extra pages)
    const customerName = truncate(data.customerName || "—", 42);
    doc.fontSize(22).font("Helvetica-Bold").fillColor(TEXT_DARK).text(customerName, left + 24, y, { width: pageW - 48, align: "center", lineBreak: false });
    y += 28;

    doc.fontSize(11).font("Helvetica").fillColor(TEXT_MUTED).text("has purchased the following product with a valid warranty period.", left + 24, y, { width: pageW - 48, align: "center", lineBreak: false });
    y += 28;

    // ----- Product & Warranty details: all warranty fields visible -----
    const tableLeft = left + 24;
    const tableW = pageW - 48;
    const halfW = tableW / 2;
    const col1X = tableLeft + 16;
    const col2X = tableLeft + halfW + 12;
    const labelW = 92;
    const valueW = halfW - labelW - 20;
    const rowH = 20;

    // Build rows from warranty data (product-based details)
    const productRows = [
        { label: "Product", value: data.productName || "—" },
        { label: "Serial Number", value: data.serialNo || "—" },
        { label: "Item Code", value: data.itemCode || "—" },
        { label: "Dealer / Seller", value: data.sellerName || data.instNameDealer || "—" },
        { label: "Installation / DOP", value: data.dopInstallation || "—" },
        { label: "Invoice Number", value: data.invoiceNumber || "—" },
        { label: "Customer Phone", value: data.phone || "—" },
    ];
    const warrantyRows = [
        { label: "Warranty ID", value: data.warrantyCode || "—" },
        { label: "Warranty Start", value: data.warrantyStartDate || "—" },
        { label: "Valid Until", value: data.warrantyEndDate || "—" },
    ];
    if (data.vehicleNumber || data.vehicleChassisNumber) {
        productRows.push({ label: data.vehicleNumber ? "Vehicle Number" : "Vehicle Chassis No.", value: data.vehicleNumber || data.vehicleChassisNumber || "—" });
    }
    if (data.custom_field_name1) {
        productRows.push({ label: data.custom_field_name1, value: data.custom_field_value1 || "—" });
    }
    if (data.custom_field_name2) {
        productRows.push({ label: data.custom_field_name2, value: data.custom_field_value2 || "—" });
    }

    // Cap rows so table fits on one page (no overflow)
    const totalRows = Math.max(productRows.length, warrantyRows.length);
    const maxRowsToShow = Math.min(totalRows, 8);
    const boxH = maxRowsToShow * rowH + 52;
    doc.fillColor(LIGHT_BLUE_BG).roundedRect(tableLeft, y, tableW, boxH, 8).fill();
    doc.strokeColor(LIGHT_BLUE_BORDER).lineWidth(0.8).roundedRect(tableLeft, y, tableW, boxH, 8).stroke();

    doc.fontSize(9).font("Helvetica-Bold").fillColor(DEEP_BLUE).text("Product & warranty details", tableLeft + 16, y + 12, { lineBreak: false });
    let rowY = y + 32;
    for (let i = 0; i < maxRowsToShow; i++) {
        const leftLabel = productRows[i] ? productRows[i].label : "";
        const leftVal = truncate(productRows[i] ? productRows[i].value : "", 28);
        const rightLabel = warrantyRows[i] ? warrantyRows[i].label : "";
        const rightVal = truncate(warrantyRows[i] ? warrantyRows[i].value : "", 28);
        if (leftLabel) {
            doc.fontSize(8).font("Helvetica-Bold").fillColor(TEXT_MUTED).text(leftLabel, col1X, rowY, { width: labelW, lineBreak: false });
            doc.fontSize(9).font("Helvetica").fillColor(TEXT_DARK).text(leftVal, col1X + labelW + 8, rowY - 1, { width: valueW, lineBreak: false });
        }
        if (rightLabel) {
            doc.fontSize(8).font("Helvetica-Bold").fillColor(TEXT_MUTED).text(rightLabel, col2X, rowY, { width: labelW, lineBreak: false });
            doc.fontSize(9).font("Helvetica").fillColor(TEXT_DARK).text(rightVal, col2X + labelW + 8, rowY - 1, { width: valueW, lineBreak: false });
        }
        rowY += rowH;
    }

    y += boxH + 18;

    // Optional terms link (one line, truncated so no wrap)
    if (data.terms_and_conditions_link) {
        const termsText = "Terms: " + truncate(data.terms_and_conditions_link, 55);
        doc.fontSize(8).font("Helvetica").fillColor(DEEP_BLUE).text(termsText, left + 24, y, { width: pageW - 48, align: "center", link: data.terms_and_conditions_link, lineBreak: false });
        y += 14;
    }

    // Thank you – two fixed lines so no flow/extra pages
    const thankYouBrand = data.companyName || "E-Warrantify";
    doc.fontSize(10).font("Helvetica").fillColor(TEXT_MUTED).text("Thank you for registering our product with " + truncate(thankYouBrand, 24) + ".", left + 24, y, { width: pageW - 48, align: "center", lineBreak: false });
    y += 14;
    doc.fontSize(10).font("Helvetica").fillColor(TEXT_MUTED).text("Please keep this certificate as proof of your warranty.", left + 24, y, { width: pageW - 48, align: "center", lineBreak: false });
    y += 20;

    // ----- Footer: seal and disclaimer – use fixed positions inside content area (no blank pages) -----
    const marginBottom = 50;
    const footerStartY = pageHeight - marginBottom - 70;
    const bottomY = pageHeight - marginBottom - 38;

    // Left: circular warranty seal
    const sealX = left + 70;
    const sealY = footerStartY + 18;
    doc.fillColor(GOLD_LIGHT).circle(sealX, sealY, 28).fill();
    doc.strokeColor(GOLD).lineWidth(1.2).circle(sealX, sealY, 28).stroke();
    doc.fontSize(8).font("Helvetica-Bold").fillColor(WHITE).text("WARRANTY", sealX - 24, sealY - 8, { width: 48, align: "center", lineBreak: false });
    doc.fontSize(12).font("Helvetica-Bold").fillColor(WHITE).text("✓", sealX - 6, sealY + 2, { width: 14, align: "center", lineBreak: false });

    // Signature (right of seal)
    if (data.signatureBuffer) {
        try {
            doc.image(data.signatureBuffer, sealX + 80, sealY - 10, { width: 90, height: 32 });
            doc.fontSize(7).font("Helvetica").fillColor(TEXT_MUTED).text("Authorized Representative", sealX + 80, sealY + 26, { lineBreak: false });
        } catch (_) {}
    }
    // QR code (bottom right)
    if (data.qrCodeBuffer) {
        try {
            doc.image(data.qrCodeBuffer, left + pageW - 70, sealY - 8, { width: 44, height: 44 });
        } catch (_) {}
    }

    // Bottom line and disclaimer (one line each, no wrap) – well above page bottom
    doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(left + 24, bottomY).lineTo(left + pageW - 24, bottomY).stroke();
    doc.fontSize(8).font("Helvetica").fillColor(TEXT_MUTED).text("This is an official warranty certificate. Please retain for your records.", left + 24, bottomY + 8, { width: pageW - 48, align: "center", lineBreak: false });
    doc.fontSize(7).fillColor("#94a3b8").text("Powered by E-Warrantify", left + 24, bottomY + 22, { width: pageW - 48, align: "center", lineBreak: false });

    doc.end();
    return new Promise((resolve, reject) => {
        stream.on("end", () => resolve(finalString));
        stream.on("error", reject);
    });
}
