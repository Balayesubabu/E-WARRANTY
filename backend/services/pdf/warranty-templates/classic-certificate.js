import PDFDocument from "pdfkit";
import { Base64Encode } from "base64-stream";

/** Truncate to one line so PDF never wraps (avoids extra pages). */
function truncate(str, maxLen = 28) {
    const s = String(str ?? "").trim();
    if (s.length <= maxLen) return s || "—";
    return s.slice(0, maxLen - 1) + "…";
}

/**
 * Classic warranty certificate – two-column landscape, one page only.
 * All text uses lineBreak: false and truncated values so PDFKit never adds pages.
 */
export async function renderClassicCertificate(data) {
    const doc = new PDFDocument({ layout: "landscape" });
    let finalString = "";
    const stream = doc.pipe(new Base64Encode());
    stream.on("data", (chunk) => { finalString += chunk; });

    const LABEL_WIDTH = 115;
    const VALUE_WIDTH = 120;
    const LINE_Y_OFFSET = 18;
    const optsLabel = { width: LABEL_WIDTH, lineBreak: false };
    const optsValue = { width: VALUE_WIDTH, lineBreak: false };

    const add = (label, value, xLabel, y, xValue) => {
        const vx = xValue ?? (xLabel < 100 ? 218 : 548);
        doc.font("Helvetica-Bold").fontSize(11).fillColor("#374151").text(label, xLabel, y, optsLabel);
        doc.font("Helvetica").fontSize(12).fillColor("#111827").text(truncate(value, 22), vx, y - 1, optsValue);
        doc.strokeColor("#9ca3af").lineWidth(0.5).moveTo(vx - 2, y + LINE_Y_OFFSET).lineTo(vx + VALUE_WIDTH, y + LINE_Y_OFFSET).stroke();
    };

    doc.fontSize(22).font("Helvetica-Bold").fillColor("#111827").text("Warranty Certificate", 340, 40, { lineBreak: false });
    if (data.companyLogoBuffer) {
        doc.image(data.companyLogoBuffer, 75, 30, { width: 100, height: 75 });
    }

    add("Customer Name", data.customerName, 60, 120);
    add("Product Name", data.productName, 60, 160);
    add("Item Code", data.itemCode, 60, 200);
    add("Warranty Start Date", data.warrantyStartDate, 60, 240);
    add("Seller Name", data.sellerName, 60, 280);
    add("DOP/Installation", data.dopInstallation, 60, 320);
    add("Inst. Name/Dealer", data.instNameDealer, 60, 360);

    const vehicleLabel = data.vehicleNumber ? "Vehicle Number" : "Vehicle Chassis No.";
    const vehicleValue = data.vehicleNumber || data.vehicleChassisNumber || "";
    add(vehicleLabel, vehicleValue, 60, 400);

    if (data.custom_field_name2) {
        add(data.custom_field_name2, data.custom_field_value2, 60, 440, 245);
    }

    add("Phone Number", data.phone, 400, 120, 548);
    add("Product Serial No.", data.serialNo, 400, 160, 548);
    add("Warranty ID/No.", data.warrantyCode, 400, 200, 548);
    add("Warranty End Date", data.warrantyEndDate, 400, 240, 548);
    add("Invoice Number", data.invoiceNumber, 400, 320, 548);

    if (data.custom_field_name1) {
        const cfY = 400;
        const cfValueY = 398;
        const vx = 548;
        doc.font("Helvetica-Bold").fontSize(11).fillColor("#374151").text(truncate(data.custom_field_name1, 18), 400, cfY, optsLabel);
        doc.font("Helvetica").fontSize(12).fillColor("#111827").text(truncate(data.custom_field_value1, 22), vx, cfValueY - 1, optsValue);
        doc.strokeColor("#9ca3af").lineWidth(0.5).moveTo(vx - 2, cfValueY + LINE_Y_OFFSET).lineTo(vx + VALUE_WIDTH, cfValueY + LINE_Y_OFFSET).stroke();
    }

    if (data.terms_and_conditions) {
        const termsStr = Array.isArray(data.terms_and_conditions) ? data.terms_and_conditions.join(" ") : String(data.terms_and_conditions);
        doc.font("Helvetica-Bold").fontSize(11).fillColor("#374151").text("Terms and Conditions", 60, 465, { align: "center", lineBreak: false });
        doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text(truncate(termsStr, 120), 60, 485, { width: 400, lineBreak: false });
    }
    if (data.terms_and_conditions_link) {
        doc.font("Helvetica").fontSize(11).fillColor("#111827").text("For More Info.", 60, 520, { link: data.terms_and_conditions_link, align: "center", underline: true, lineBreak: false });
    }

    // Signature and QR code (real-world style) – bottom area
    const botY = 535;
    if (data.signatureBuffer) {
        try {
            doc.image(data.signatureBuffer, 60, botY, { width: 100, height: 36 });
            doc.fontSize(8).font("Helvetica").fillColor("#6b7280").text("Authorized Representative", 60, botY + 40, { lineBreak: false });
        } catch (_) {}
    }
    if (data.qrCodeBuffer) {
        try {
            doc.image(data.qrCodeBuffer, 680, botY, { width: 48, height: 48 });
        } catch (_) {}
    }

    doc.end();
    return new Promise((resolve, reject) => {
        stream.on("end", () => resolve(finalString));
        stream.on("error", reject);
    });
}
