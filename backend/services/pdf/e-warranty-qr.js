import PDFDocument from 'pdfkit';
import qrcode from 'qrcode';
import { Base64Encode } from 'base64-stream';
import dayjs from 'dayjs';

const MAX_CUSTOM_FIELDS_ON_PDF = 15;

/**
 * Normalizes optional custom_fields from API (array of { key, value }).
 * Empty / invalid input yields [] so existing PDF layouts are unchanged.
 */
const normalizeCustomFields = (raw) => {
    if (!raw || !Array.isArray(raw)) return [];
    const out = [];
    for (const f of raw) {
        if (!f || typeof f !== "object") continue;
        const key = String(f.key ?? f.name ?? "").trim();
        if (!key) continue;
        const value = String(f.value ?? "").trim();
        out.push({ key: key.slice(0, 120), value: value.slice(0, 500) });
        if (out.length >= MAX_CUSTOM_FIELDS_ON_PDF) break;
    }
    return out;
};

/** Rough wrap estimate for PDFKit text with fixed font size */
const estimateTextHeight = (text, widthPt, fontSizePt, lineHeightPt) => {
    const avgCharPt = fontSizePt * 0.52;
    const charsPerLine = Math.max(16, Math.floor(widthPt / avgCharPt));
    const lines = Math.max(1, Math.ceil(String(text).length / charsPerLine));
    return lines * lineHeightPt;
};

/**
 * Calculates warranty period in human-readable format
 */
const calculateWarrantyPeriodReadable = (fromDate, toDate) => {
    const from = dayjs(fromDate);
    const to = dayjs(toDate);
    const totalDays = to.diff(from, 'day');

    let remainingDays = totalDays;
    let years = 0;
    let months = 0;
    let days = 0;

    let currentDate = from;
    while (remainingDays >= 365) {
        const nextYear = currentDate.add(1, 'year');
        const daysInYear = nextYear.diff(currentDate, 'day');

        if (remainingDays >= daysInYear) {
            years++;
            remainingDays -= daysInYear;
            currentDate = nextYear;
        } else {
            break;
        }
    }

    while (remainingDays >= 28) {
        const nextMonth = currentDate.add(1, 'month');
        const daysInMonth = nextMonth.diff(currentDate, 'day');

        if (remainingDays >= daysInMonth) {
            months++;
            remainingDays -= daysInMonth;
            currentDate = nextMonth;
        } else {
            break;
        }
    }

    days = remainingDays;

    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(' ') : '0 days';
};

const getBaseOrigin = (url) => {
    try {
        return new URL(url).origin;
    } catch {
        return url;
    }
};

const generateWarrantyQRPDF = async (comapanyUrl, warrantyDataArray, printType = 'A4') => {
    const doc = new PDFDocument({
        size: printType === 'thermal' ? [80 * 4, 297.64] : 'A4',
        margin: printType === 'thermal' ? 10 : 50
    });

    let finalString = '';
    const stream = doc.pipe(new Base64Encode());

    const ProductName = "Product Name";
    const ItemCode = "Item Code";
    const WarrantyCode = "Warranty Code";
    const SerialNumber = "Serial Number";
    const WarrantyPeriod = "Warranty Period";

    if (printType === 'thermal') {
        for (let i = 0; i < warrantyDataArray.length; i++) {
            const warrantyData = warrantyDataArray[i];

            let qrUrl;
            if (warrantyData.activation_token) {
                qrUrl = `${getBaseOrigin(comapanyUrl)}/activate/${warrantyData.activation_token}`;
            } else {
                const baseUrl = comapanyUrl;
                const itemCode = warrantyData.factory_item_number || warrantyData.factory_service_number || warrantyData.product_id || warrantyData.service_id || '';
                const params = new URLSearchParams({
                    provider_id: warrantyData.provider_id,
                    product_name: warrantyData.product_name,
                    item_code: itemCode,
                    serial_number: warrantyData.serial_no,
                    warranty_code: warrantyData.warranty_id,
                    warranty_from: warrantyData.warranty_from,
                    warranty_to: warrantyData.warranty_to,
                    warranty_days: warrantyData.warranty_days,
                });
                qrUrl = `${baseUrl}?${params.toString()}`;
            }

            const qrCodeBuffer = await qrcode.toBuffer(qrUrl, {
                width: 200,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            if (i > 0) {
                doc.addPage();
            }

            const itemCodeDisplay = warrantyData.factory_item_number || warrantyData.factory_service_number || warrantyData.product_id || warrantyData.service_id || '—';

            const boxX = 10;
            const boxY = 10;
            const boxWidth = doc.page.width - 20;
            const qrAreaWidth = 70;
            const textWidth = boxWidth - qrAreaWidth - 10;
            const lineHeight = 12;
            const customs = normalizeCustomFields(warrantyData.custom_fields);

            let customExtra = 0;
            if (customs.length > 0) {
                doc.fontSize(7);
                customExtra = 6;
                for (const { key, value } of customs) {
                    const line = `${key}: ${value}`;
                    customExtra += estimateTextHeight(line, textWidth, 7, lineHeight);
                }
            }

            const boxHeight = 100 + customExtra;

            doc.rect(boxX, boxY, boxWidth, boxHeight).stroke();

            doc.fontSize(7);
            let textY = boxY + 8;

            doc.text(ProductName + ": " + String(warrantyData.product_name || "").toUpperCase(), boxX + 8, textY, {
                width: textWidth,
                lineGap: 1
            });
            textY += lineHeight;

            doc.text(ItemCode + ": " + itemCodeDisplay, boxX + 8, textY, {
                width: textWidth,
                lineGap: 1
            });
            textY += lineHeight;

            doc.text(SerialNumber + ": " + warrantyData.serial_no, boxX + 8, textY, {
                width: textWidth,
                lineGap: 1
            });
            textY += lineHeight;

            doc.text(WarrantyCode + ": " + warrantyData.warranty_id, boxX + 8, textY, {
                width: textWidth,
                lineGap: 1
            });
            textY += lineHeight;

            const warrantyPeriodReadable = warrantyData.warranty_period_readable ||
                calculateWarrantyPeriodReadable(warrantyData.warranty_from, warrantyData.warranty_to);

            doc.text(WarrantyPeriod + ": " + warrantyPeriodReadable, boxX + 8, textY, {
                width: textWidth,
                lineGap: 1
            });
            textY += lineHeight;

            if (customs.length > 0) {
                textY += 2;
                for (const { key, value } of customs) {
                    const line = `${key}: ${value}`;
                    const h = estimateTextHeight(line, textWidth, 7, lineHeight);
                    doc.text(line, boxX + 8, textY, {
                        width: textWidth,
                        lineGap: 1
                    });
                    textY += h;
                }
            }

            const qrSize = 55;
            const qrX = boxX + boxWidth - qrAreaWidth + (qrAreaWidth - qrSize) / 2;
            const qrY = boxY + (boxHeight - qrSize) / 2;

            doc.image(qrCodeBuffer, qrX, qrY, { width: qrSize, height: qrSize });
        }
    } else {
        const pageWidth = doc.page.width - 100;
        const marginTop = 50;
        const marginBottom = 50;
        const startX = 50;
        const textWidth = pageWidth - 120;
        const lineHeight = 15;
        const baseInnerHeight = 90;
        const rowGap = 10;
        const maxY = doc.page.height - marginBottom;

        let y = marginTop;

        for (let i = 0; i < warrantyDataArray.length; i++) {
            const warrantyData = warrantyDataArray[i];
            const customs = normalizeCustomFields(warrantyData.custom_fields);

            let extraInner = 0;
            if (customs.length > 0) {
                doc.fontSize(9);
                extraInner = 8;
                for (const { key, value } of customs) {
                    const line = `${key}: ${value}`;
                    extraInner += estimateTextHeight(line, textWidth, 9, lineHeight);
                }
            }

            const innerBoxHeight = baseInnerHeight + extraInner;
            const rowStep = innerBoxHeight + rowGap;

            if (y + rowStep > maxY) {
                doc.addPage();
                y = marginTop;
            }

            const currentY = y;

            let qrUrl;
            if (warrantyData.activation_token) {
                qrUrl = `${getBaseOrigin(comapanyUrl)}/activate/${warrantyData.activation_token}`;
            } else {
                const baseUrl = comapanyUrl;
                const itemCodeParam = warrantyData.factory_item_number || warrantyData.factory_service_number || warrantyData.product_id || warrantyData.service_id || '';
                const params = new URLSearchParams({
                    provider_id: warrantyData.provider_id,
                    product_name: warrantyData.product_name,
                    item_code: itemCodeParam,
                    serial_number: warrantyData.serial_no,
                    warranty_code: warrantyData.warranty_id,
                    warranty_from: warrantyData.warranty_from,
                    warranty_to: warrantyData.warranty_to,
                    warranty_days: warrantyData.warranty_days,
                });
                qrUrl = `${baseUrl}?${params.toString()}`;
            }

            const qrCodeBuffer = await qrcode.toBuffer(qrUrl, {
                width: 200,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            const itemCodeDisplayA4 = warrantyData.factory_item_number || warrantyData.factory_service_number || warrantyData.product_id || warrantyData.service_id || '—';

            doc.rect(startX, currentY, pageWidth, innerBoxHeight).stroke();

            const separatorX = startX + pageWidth - 100;
            doc.moveTo(separatorX, currentY)
                .lineTo(separatorX, currentY + innerBoxHeight)
                .stroke();

            doc.fontSize(9);
            let textY = currentY + 12;

            doc.text(ProductName + ": " + String(warrantyData.product_name || "").toUpperCase(), startX + 10, textY, {
                width: textWidth,
                lineGap: 1
            });
            textY += lineHeight;

            doc.text(ItemCode + ": " + itemCodeDisplayA4, startX + 10, textY, {
                width: textWidth,
                lineGap: 1
            });
            textY += lineHeight;

            doc.text(SerialNumber + ": " + warrantyData.serial_no, startX + 10, textY, {
                width: textWidth,
                lineGap: 1
            });
            textY += lineHeight;

            doc.text(WarrantyCode + ": " + warrantyData.warranty_id, startX + 10, textY, {
                width: textWidth,
                lineGap: 1
            });
            textY += lineHeight;

            const warrantyPeriodReadable = warrantyData.warranty_period_readable ||
                calculateWarrantyPeriodReadable(warrantyData.warranty_from, warrantyData.warranty_to);

            doc.text(WarrantyPeriod + ": " + warrantyPeriodReadable, startX + 10, textY, {
                width: textWidth,
                lineGap: 1
            });
            textY += lineHeight;

            if (customs.length > 0) {
                textY += 4;
                for (const { key, value } of customs) {
                    const line = `${key}: ${value}`;
                    const h = estimateTextHeight(line, textWidth, 9, lineHeight);
                    doc.text(line, startX + 10, textY, {
                        width: textWidth,
                        lineGap: 1
                    });
                    textY += h;
                }
            }

            const qrSize = 75;
            const qrAreaWidth = 100;
            const qrX = separatorX + (qrAreaWidth - qrSize) / 2;
            const qrY = currentY + (innerBoxHeight - qrSize) / 2;

            doc.image(qrCodeBuffer, qrX, qrY, { width: qrSize, height: qrSize });

            y += rowStep;
        }
    }

    return new Promise((resolve, reject) => {
        stream.on('data', chunk => finalString += chunk);
        stream.on('end', () => resolve(finalString));
        stream.on('error', reject);
        doc.end();
    });
};

export { generateWarrantyQRPDF };
