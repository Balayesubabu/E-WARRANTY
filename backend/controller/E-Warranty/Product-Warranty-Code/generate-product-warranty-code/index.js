import { getProviderByUserId, getProviderById, createWarrantyCode, updateProviderWarrantySerialNumber, getProviderWarrantySettings, getFranchiseInventoryItemCode } from "./query.js";
import { resolveRegistrationUrlFromRequest } from "../../../../utils/resolveRegistrationUrl.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { generateNanoId } from "../../../../services/generate-nano-id.js";
import { generatePrefixFromCompanyName } from "../../../../services/generate-invoice-no.js"
import { generateWarrantyQRPDF } from "../../../../services/pdf/e-warranty-qr.js";
import crypto from "crypto";
import { checkBalanceForWarranty, debitForWarrantyCodes, parseWarrantyMonths } from "../../../../services/coinService.js";

const generateActivationToken = () => {
    return crypto.randomBytes(24).toString("base64url");
};

const generateProductWarrantyCodeEndpoint = async (req, res) => {
    try {
        logger.info(`generateProductWarrantyCodeEndpoint`);

        if (req.type && req.type !== 'provider' && req.type !== 'staff') {
            return returnError(res, StatusCodes.FORBIDDEN, `Only the owner or staff can generate warranty codes`);
        }

        const provider = req.type === "staff"
            ? await getProviderById(req.provider_id)
            : await getProviderByUserId(req.user_id);
        if (!provider || !provider.id) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with id: ${provider.id} ---`);

        const rawRegistrationUrl = await getProviderWarrantySettings(provider.id);
        // For QR PDFs, prefer a LAN/public base URL so scans work from mobile.
        const comapanyUrl = resolveRegistrationUrlFromRequest(rawRegistrationUrl ?? "", req, { for_qr: true });
        if (!comapanyUrl) {
            logger.error(`--- Registration URL not configured (System Settings or FRONTEND_URL) ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Registration URL not configured. Set it under System Settings or set FRONTEND_URL on the server to your public app URL.`);
        }
        logger.info(`--- Registration URL resolved for QR PDF ---`);

        const data = req.body;

        let {
            product_name,
            type,
            other_type,
            vehicle_number,
            product_id,
            service_id,
            serial_no,
            warranty_from,
            warranty_to,
            factory_item_number,
            factory_service_number,
            warranty_registration_url,
            warranty_check,
            warranty_check_interval,
            warranty_interval_dates,
            warranty_reminder_days,
            serial_no_quantity,
            terms_and_conditions,
            terms_and_conditions_link,
            quantity,
            warranty_code,
            warranty_days,
            warranty_period_readable,
            is_active,
            print_type,
            batch_id,
            assigned_dealer_id,
            franchise_inventory_id,
            custom_fields,
        } = data;

        /** Optional [{ key, value }] for QR PDF labels — same shape as warranty policy custom_fields */
        let normalizedPdfCustomFields = null;
        if (Array.isArray(custom_fields) && custom_fields.length > 0) {
            normalizedPdfCustomFields = custom_fields
                .map((f) => ({
                    key: String(f?.key ?? "").trim(),
                    value: String(f?.value ?? "").trim(),
                }))
                .filter((f) => f.key.length > 0)
                .slice(0, 20);
            if (normalizedPdfCustomFields.length === 0) {
                normalizedPdfCustomFields = null;
            }
        }

        // Item code from system: when franchise_inventory_id is sent and factory_item_number is empty, resolve from FranchiseInventory
        const hasItemCodeFromRequest = factory_item_number != null && String(factory_item_number).trim() !== '';
        if (franchise_inventory_id && !hasItemCodeFromRequest) {
            const inventoryRow = await getFranchiseInventoryItemCode(provider.id, franchise_inventory_id);
            if (inventoryRow?.product_item_code) {
                factory_item_number = inventoryRow.product_item_code;
                if (!product_name?.trim() && inventoryRow.product_name) {
                    product_name = inventoryRow.product_name;
                }
            }
        }

        const rawSerialQty = serial_no_quantity ?? data?.qr_count ?? data?.total_units ?? 1;
        const serialNoQty = Math.max(1, parseInt(rawSerialQty, 10) || 1);
        const qty = Math.max(1, parseInt(quantity, 10) || 1);
        const totalCodes = serialNoQty * qty;
        logger.info(`--- Raw counts: serial_no_quantity=${JSON.stringify(serial_no_quantity)}, qr_count=${JSON.stringify(data?.qr_count)}, total_units=${JSON.stringify(data?.total_units)} ---`);
        logger.info(`--- Resolved: serialNoQty=${serialNoQty}, qty=${qty}, total codes=${totalCodes} ---`);

        const warrantyMonths = parseWarrantyMonths(warranty_days, warranty_period_readable);
        const costPerCode = Math.max(1, Math.ceil(warrantyMonths / 3));
        logger.info(`--- Warranty duration: ${warrantyMonths} months (cost: ${costPerCode} coins/code) ---`);

        // Check coin balance (duration-based: 3mo=1, 6mo=2, 1yr=4 coins per code)
        const coinCheck = await checkBalanceForWarranty(provider.id, warrantyMonths, totalCodes);
        if (!coinCheck.allowed) {
            logger.warn(`Insufficient coins for ${totalCodes} warranty codes: ${coinCheck.current} < ${coinCheck.required}`);
            return returnError(
                res, 
                StatusCodes.PAYMENT_REQUIRED, 
                `Insufficient coins. You need ${coinCheck.required} coins to generate ${totalCodes} warranty codes. Current balance: ${coinCheck.current}.`,
                { 
                    error_code: "INSUFFICIENT_COINS",
                    required: coinCheck.required,
                    current: coinCheck.current,
                    quantity: totalCodes
                }
            );
        }

        let finalString = '';
        let group_id = generateNanoId("AlphaNumeric", 12);
        let response_warranty_code = [];
        let warrantyDataArray = [];
        let company_prefix = provider.invoice_prefix ? provider.invoice_prefix : generatePrefixFromCompanyName(provider.company_name);

        let current_seq = provider.warranty_serial_number ? provider.warranty_serial_number : 1;

        for (let i = 1; i <= serialNoQty; i++) {
            let yearMonth = (new Date().getMonth() + 1).toString().padStart(2, '0') + new Date().getFullYear().toString().slice(-2);
            let serNo = '';

            if (serial_no) {
                if (serial_no.includes('-')) {
                    serNo = serial_no + '-' + current_seq.toString().padStart(6, '0');
                } else {
                    serNo = serial_no + '-' + yearMonth + '-' + current_seq.toString().padStart(6, '0');
                }
            }
            else {
                serNo = company_prefix + '-' + yearMonth + '-' + current_seq.toString().padStart(6, '0');
            }
            let sequence_no = current_seq;

            for (let k = 1; k <= qty; k++) {
                let warranty_id = warranty_code.toString() + generateNanoId("AlphaNumeric", 8);
                warranty_id = warranty_id.toUpperCase();

                if (warranty_check) {
                    if (!warranty_interval_dates.length || warranty_interval_dates.length !== warranty_check_interval) {
                        warranty_interval_dates = [];

                        if (warranty_check_interval === 1) {
                            const startDate = new Date(warranty_from);
                            const endDate = new Date(warranty_to);
                            const midDate = new Date((startDate.getTime() + endDate.getTime()) / 2);
                            warranty_interval_dates.push(new Date(midDate));
                            warranty_interval_dates.push(new Date(endDate));
                        } else {
                            const startDate = new Date(warranty_from);
                            const endDate = new Date(warranty_to);

                            const intervalDays = Math.floor(warranty_days / (warranty_check_interval + 1));
                            logger.info(`Total days: ${warranty_days}, Interval days: ${intervalDays}`);
                            logger.info(`Start date: ${startDate.toISOString().split('T')[0]}, End date: ${endDate.toISOString().split('T')[0]}`);

                            warranty_interval_dates.push(new Date(startDate));

                            let currentDate;
                            for (let j = 1; j <= warranty_check_interval; j++) {
                                currentDate = new Date(startDate);
                                currentDate.setDate(currentDate.getDate() + (intervalDays * j));

                                const nextMonth = new Date(currentDate);
                                nextMonth.setDate(1);
                                if (currentDate.getMonth() !== nextMonth.getMonth()) {
                                    currentDate = new Date(nextMonth);
                                    currentDate.setDate(0);
                                }

                                warranty_interval_dates.push(new Date(currentDate));
                                logger.info(`Generated date ${j}: ${currentDate.toISOString().split('T')[0]} (${intervalDays * j} days after start)`);
                            }

                            warranty_interval_dates.push(new Date(endDate));
                        }

                        warranty_interval_dates.sort((a, b) => a - b);

                        warranty_interval_dates = [...new Set(warranty_interval_dates.map(date => date.getTime()))]
                            .map(time => new Date(time));

                        logger.info(`Final warranty check dates: ${warranty_interval_dates.map(d => d.toISOString().split('T')[0]).join(', ')}`);
                    }
                }

                const activationToken = generateActivationToken();

                const generated_warranty_code = await createWarrantyCode(
                    provider.id,
                    product_name,
                    type,
                    other_type,
                    vehicle_number,
                    product_id,
                    service_id,
                    serNo,
                    warranty_from,
                    warranty_to,
                    quantity,
                    sequence_no.toString(),
                    warranty_id,
                    warranty_check,
                    warranty_check_interval,
                    warranty_interval_dates,
                    warranty_reminder_days,
                    terms_and_conditions,
                    terms_and_conditions_link,
                    group_id,
                    warranty_days,
                    warranty_period_readable,
                    is_active,
                    activationToken,
                    batch_id || null,
                    assigned_dealer_id || null,
                    factory_item_number || null,
                    factory_service_number || null,
                    franchise_inventory_id || null,
                );

                if (!generated_warranty_code) {
                    return returnError(res, StatusCodes.BAD_REQUEST, `Failed to generate warranty code`);
                }

                response_warranty_code.push(generated_warranty_code);

                const provider_id = provider.id;
                warrantyDataArray.push({
                    provider_id,
                    product_name,
                    product_id,
                    service_id,
                    serial_no: serNo,
                    warranty_id,
                    warranty_from,
                    warranty_to,
                    warranty_days,
                    warranty_period_readable,
                    activation_token: activationToken,
                    factory_item_number: factory_item_number || null,
                    factory_service_number: factory_service_number || null,
                    ...(normalizedPdfCustomFields ? { custom_fields: normalizedPdfCustomFields } : {}),
                });
            }

            current_seq++;
        }

        await updateProviderWarrantySerialNumber(provider.id, current_seq);

        // Deduct coins for generated warranty codes (duration-based cost)
        try {
            await debitForWarrantyCodes(
                provider.id,
                warrantyMonths,
                totalCodes,
                `Generated ${totalCodes} warranty codes for ${product_name || 'product'}`,
                { reference_id: group_id, reference_type: "warranty_code_batch" }
            );
            logger.info(`--- Coins debited for ${totalCodes} warranty codes (${warrantyMonths}mo) ---`);
        } catch (coinError) {
            logger.error(`Failed to debit coins: ${coinError.message}`);
        }

        finalString = await generateWarrantyQRPDF(comapanyUrl, warrantyDataArray, print_type || 'A4');

        return returnResponse(res, StatusCodes.OK, `Warranty code is successfully generated!`, {
            data: finalString,
            groupId: group_id,
            generated_warranty_code: response_warranty_code
        });

    } catch (error) {
        logger.error(`generateProductWarrantyCodeEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to generate product warranty code`);
    }
}

export { generateProductWarrantyCodeEndpoint };