import { logger } from "./logger.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const SMS_SENDER_ID = process.env.SMS_SENDER_ID || "GVCC";
const SMS_TEMPLATE_NAME = process.env.SMS_TEMPLATE_NAME || "Phone+Validation+From+GVCC";

/**
 * Normalize Indian phone number to 10 digits for SMS API.
 * Handles: 9876543210, 919876543210, 09876543210, +919876543210
 * @param {string} phone - Raw phone input
 * @returns {string|null} 10-digit number or null if invalid
 */
const normalizePhoneForIndia = (phone) => {
    if (!phone || typeof phone !== "string") return null;
    const digits = phone.replace(/\D/g, "");
    const validStarts = ["6", "7", "8", "9"];
    // Reject 10-digit starting with "91" (likely country code + 8 digits)
    if (digits.length === 10 && digits.startsWith("91")) return null;
    if (digits.length === 10 && validStarts.some((s) => digits.startsWith(s))) {
        return digits;
    }
    if (digits.length === 11 && digits.startsWith("0")) {
        const sliced = digits.slice(1);
        if (sliced.length === 10 && validStarts.some((s) => sliced.startsWith(s))) return sliced;
    }
    if (digits.length === 12 && digits.startsWith("91")) {
        const sliced = digits.slice(2);
        if (sliced.length === 10 && validStarts.some((s) => sliced.startsWith(s))) return sliced;
    }
    return null;
};

/**
 * Try 2Factor.in V1 simple OTP API - no template/sender config needed.
 * https://2factor.in/API/V1/{api_key}/SMS/{phone}/{otp}
 */
const sendOTPViaV1 = async (phone91, otp) => {
    const apiKey = process.env.TWO_FACTOR_API_KEY;
    if (!apiKey) throw new Error("TWO_FACTOR_API_KEY is not configured");
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone91}/${otp}`;
    logger.info(`--- Trying 2Factor V1 OTP API ---`);
    const response = await axios.post(url);
    if (response.data.Status !== "Success") {
        throw new Error(response.data.Details || response.data.Status || "SMS failed");
    }
    return response;
};

/**
 * Try 2Factor.in R1 transactional SMS (requires approved sender + template).
 */
const sendViaR1Transactional = async (toNumber, templateName, var1Value) => {
    const apiKey = process.env.TWO_FACTOR_API_KEY;
    if (!apiKey) throw new Error("TWO_FACTOR_API_KEY is not configured");
    let var1Param = "";
    if (var1Value) var1Param = `&var1=${encodeURIComponent(var1Value)}`;
    const url = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${apiKey}&to=${encodeURIComponent(toNumber)}&from=${encodeURIComponent(SMS_SENDER_ID)}&templatename=${encodeURIComponent(templateName)}${var1Param}`;
    logger.info(`--- Trying 2Factor R1 transactional SMS ---`);
    const response = await axios.get(url);
    if (response.data.Status !== "Success") {
        throw new Error(response.data.Details || response.data.Status || "SMS failed");
    }
    return response;
};

const sendSMS = async (phone_number, message) => {
    const normalized = normalizePhoneForIndia(phone_number);
    if (!normalized) {
        logger.error(`--- Invalid phone format: ${phone_number} ---`);
        throw new Error(`Invalid phone number format. Please use a valid 10-digit Indian mobile number.`);
    }

    const phone91 = `91${normalized}`;
    logger.info(`--- Sending SMS to ${phone91} (normalized from ${phone_number}) ---`);

    // Detect OTP format: "X&var1=123456" - extract OTP and use V1 simple API (no template needed)
    let otpValue = null;
    if (message && message.includes("&var1=")) {
        const parts = message.split("&var1=");
        const val = (parts[1] || "").trim();
        if (/^\d{4,8}$/.test(val)) otpValue = val;
    }

    if (otpValue) {
        try {
            await sendOTPViaV1(phone91, otpValue);
            logger.info(`--- OTP sent via 2Factor V1 ---`);
            return { data: { Status: "Success" } };
        } catch (v1Err) {
            logger.warn(`--- V1 OTP API failed: ${v1Err.message}, skipping R1 (template may be unconfigured) ---`);
            throw new Error(
                v1Err.message?.includes("Invalid") ? v1Err.message : "Failed to send OTP. Please try with your email address instead."
            );
        }
    }

    // Non-OTP message: use R1 transactional (requires SMS_SENDER_ID and SMS_TEMPLATE_NAME in 2Factor)
    const parts = message && message.includes("&var1=") ? message.split("&var1=") : [message, ""];
    const templateName = parts[0] || SMS_TEMPLATE_NAME;
    const var1Value = parts[1] || "";
    try {
        await sendViaR1Transactional(`+91${normalized}`, templateName, var1Value || undefined);
        logger.info(`--- SMS sent via 2Factor R1 ---`);
        return { data: { Status: "Success" } };
    } catch (r1Err) {
        logger.error(`--- R1 transactional SMS failed: ${r1Err.message} ---`);
        throw new Error(r1Err.message || "Failed to send SMS");
    }
};

export default sendSMS;