import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import {
    getTransactionByOrderId,
    updateTransactionStatus,
    createTransactionForOrderId,
    getProviderByOrderId,
    activateSubscriptionByOrderId,
} from "./query.js";

const verifyWebhookSignature = (payload, signature, secret) => {
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
    return expectedSignature === signature;
};

const razorpayWebhookEndpoint = async (req, res) => {
    try {
        logger.info(`RazorpayWebhookEndpoint - Received webhook`);

        const signature = req.headers["x-razorpay-signature"];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            logger.error(`--- RAZORPAY_WEBHOOK_SECRET not configured ---`);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: "error" });
        }

        if (!signature) {
            logger.error(`--- Missing Razorpay signature in webhook ---`);
            return res.status(StatusCodes.UNAUTHORIZED).json({ status: "error", message: "Missing signature" });
        }

        const rawBody = req.rawBody;
        if (!rawBody) {
            logger.error(`--- Raw body not available for webhook verification ---`);
            return res.status(StatusCodes.BAD_REQUEST).json({ status: "error", message: "Raw body required" });
        }

        const isValidSignature = verifyWebhookSignature(rawBody, signature, webhookSecret);
        if (!isValidSignature) {
            logger.error(`--- Invalid webhook signature ---`);
            return res.status(StatusCodes.UNAUTHORIZED).json({ status: "error", message: "Invalid signature" });
        }
        logger.info(`--- Webhook signature verified successfully ---`);

        const event = req.body;
        const eventType = event.event;

        logger.info(`--- Processing webhook event: ${eventType} ---`);

        switch (eventType) {
            case "payment.captured":
                await handlePaymentCaptured(event.payload.payment.entity);
                break;
            case "payment.failed":
                await handlePaymentFailed(event.payload.payment.entity);
                break;
            case "order.paid":
                await handleOrderPaid(event.payload.order.entity, event.payload.payment?.entity);
                break;
            default:
                logger.info(`--- Unhandled webhook event: ${eventType} ---`);
        }

        return res.status(StatusCodes.OK).json({ status: "ok" });
    } catch (error) {
        logger.error(`--- Error in RazorpayWebhookEndpoint: ${error} ---`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: "error" });
    }
};

const handlePaymentCaptured = async (payment) => {
    try {
        logger.info(`--- Handling payment.captured for payment_id: ${payment.id} ---`);

        const orderId = payment.order_id;
        if (!orderId) {
            logger.warn(`--- No order_id in payment.captured event ---`);
            return;
        }

        const existingTransaction = await getTransactionByOrderId(orderId);

        if (existingTransaction) {
            if (existingTransaction.transaction_status === "Paid") {
                logger.info(`--- Transaction already successful for order: ${orderId} ---`);
                return;
            }
            await updateTransactionStatus(existingTransaction.id, "Paid", payment.id);
            logger.info(`--- Updated transaction status to Paid for order: ${orderId} ---`);
        } else {
            const provider = await getProviderByOrderId(orderId);
            if (provider) {
                await createTransactionForOrderId(orderId, provider.id, payment.amount, "paid", payment.id, "Paid");
                logger.info(`--- Created new paid transaction for order: ${orderId} ---`);
            } else {
                logger.warn(`--- No provider found for order: ${orderId}, cannot create transaction ---`);
            }
        }
    } catch (error) {
        logger.error(`--- Error handling payment.captured: ${error} ---`);
        throw error;
    }
};

const handlePaymentFailed = async (payment) => {
    try {
        logger.info(`--- Handling payment.failed for payment_id: ${payment.id} ---`);

        const orderId = payment.order_id;
        if (!orderId) {
            logger.warn(`--- No order_id in payment.failed event ---`);
            return;
        }

        const existingTransaction = await getTransactionByOrderId(orderId);

        if (existingTransaction) {
            await updateTransactionStatus(existingTransaction.id, "Unpaid", payment.id);
            logger.info(`--- Updated transaction status to Unpaid for order: ${orderId} ---`);
        } else {
            const provider = await getProviderByOrderId(orderId);
            if (provider) {
                await createTransactionForOrderId(orderId, provider.id, payment.amount, "failed", payment.id, "Unpaid");
                logger.info(`--- Created new unpaid transaction for order: ${orderId} ---`);
            }
        }
    } catch (error) {
        logger.error(`--- Error handling payment.failed: ${error} ---`);
        throw error;
    }
};

const handleOrderPaid = async (order, payment) => {
    try {
        logger.info(`--- Handling order.paid for order_id: ${order.id} ---`);

        const existingTransaction = await getTransactionByOrderId(order.id);

        if (existingTransaction) {
            if (existingTransaction.transaction_status !== "Paid") {
                await updateTransactionStatus(existingTransaction.id, "Paid", payment?.id);
                logger.info(`--- Updated transaction status to Paid via order.paid for order: ${order.id} ---`);
            }
        }
    } catch (error) {
        logger.error(`--- Error handling order.paid: ${error} ---`);
        throw error;
    }
};

export { razorpayWebhookEndpoint };
