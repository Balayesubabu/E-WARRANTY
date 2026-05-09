import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getProviderByUserId, isBasePlanActiveForProvider, isBasePlan, createProviderSubscription, isSubscriptionActiveForProvider, createTransactionForOrderId, updateProviderBranches, updateTransactionStatus, getTransactionByOrderId } from "./query.js";
import getRazorpay from "../../../utils/razorpay.js";

const verifyRazorpaySignature = (orderId, paymentId, signature) => {
    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
    return generatedSignature === signature;
};

const createProviderSubscriptionEndpoint = async (req, res) => {
    try {
        logger.info(`CreateProviderSubscriptionEndpoint`);

        const user_id = req.user_id;

        const data = req.body;

        const { subscription_plan_ids, start_date, end_date, amount_paid, order_id, razorpay_payment_id, razorpay_signature, total_branches } = data;

        if (!order_id || !razorpay_payment_id || !razorpay_signature) {
            logger.error(`--- Missing required payment parameters ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Missing required payment parameters: order_id, razorpay_payment_id, and razorpay_signature are required`);
        }

        logger.info(`--- Getting provider for user id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for user id: ${user_id}`);
        }
        logger.info(`--- Provider found for user id: ${user_id} ---`);

        logger.info(`--- Verifying Razorpay signature ---`);
        const isValidSignature = verifyRazorpaySignature(order_id, razorpay_payment_id, razorpay_signature);
        if (!isValidSignature) {
            logger.error(`--- Invalid Razorpay signature for order id: ${order_id} ---`);
            await createTransactionForOrderId(order_id, provider.id, amount_paid * 100, "signature_failed", razorpay_payment_id);
            return returnError(res, StatusCodes.BAD_REQUEST, `Payment verification failed. Invalid signature.`);
        }
        logger.info(`--- Razorpay signature verified successfully ---`);

        logger.info(`--- Checking order id ${order_id} status from Razorpay ---`);
        const order = await getRazorpay().orders.fetch(order_id);

        if (order.status !== "paid") {
            logger.error(`--- Order id ${order_id} is not paid. Status: ${order.status} ---`);
            await createTransactionForOrderId(order_id, provider.id, order.amount, order.status, razorpay_payment_id);
            return returnError(res, StatusCodes.BAD_REQUEST, `Order id ${order_id} is not paid. Current status: ${order.status}`);
        }
        logger.info(`--- Order id ${order_id} is paid ---`);

        const existingTransaction = await getTransactionByOrderId(order_id);
        if (existingTransaction && existingTransaction.transaction_status === "Paid") {
            logger.info(`--- Subscription already activated for order id: ${order_id} ---`);
            return returnError(res, StatusCodes.CONFLICT, `Subscription already activated for this order`);
        }
        logger.info(`--- Razorpay verification complete ---`);

        let finalModuleSubscritptionPlans = [];
        for (let subscription_plan_id of subscription_plan_ids) {

        let providerSubscription = null;
        logger.info(`--- Checking if subscription base plan is already active for provider ---`);
        const isBasePlanActive = await isBasePlanActiveForProvider(provider.id);
        if (!isBasePlanActive) {
            logger.info(`--- Checking if subsciption plan is a base plan ---`);
            const isBasePlanSubscription = await isBasePlan(subscription_plan_id);
            if (!isBasePlanSubscription) {
                logger.error(`--- Subscription plan is not a base plan ---`);
                return returnError(res, StatusCodes.BAD_REQUEST, `Subscription plan is not a base plan and User does not have a base plan active`);
            }
            logger.info(`--- Subscription plan is a base plan ---`);

            logger.info(`--- Creating provider subscription ---`);
            providerSubscription = await createProviderSubscription(provider.id, { subscription_plan_id, start_date, end_date, is_base_plan: true, amount_paid, order_id });
            if (!providerSubscription) {
                logger.error(`--- Failed to create provider subscription ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create provider subscription`);
            }
            logger.info(`--- Provider subscription created ---`);
        } else {
            logger.info(`--- Checking if subscription plan is already active for provider ---`);
            const isSubscriptionActive = await isSubscriptionActiveForProvider(provider.id,subscription_plan_id);
            if (isSubscriptionActive) {
                logger.error(`--- Subscription plan is already active for provider ---`);
                return returnError(res, StatusCodes.BAD_REQUEST, `Subscription plan is already active for provider`);
            }
            logger.info(`--- Subscription plan is not active for provider ---`);

            logger.info(`--- Creating provider subscription ---`);
            providerSubscription = await createProviderSubscription(provider.id, { subscription_plan_id, start_date, end_date, is_base_plan: false, amount_paid, order_id });
            if (!providerSubscription) {
                logger.error(`--- Failed to create provider subscription ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create provider subscription`);
            }
            logger.info(`--- Provider subscription created ---`);

            
        }
        finalModuleSubscritptionPlans.push(providerSubscription);
    }
        logger.info(`--- Updating total branches for provider id: ${provider.id} ---`);
        const updatedProvider = await updateProviderBranches(provider.id, total_branches);
        if (!updatedProvider) {
            logger.error(`--- Failed to update total branches for provider id: ${provider.id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update total branches for provider`);
        }

        logger.info(`--- Creating success transaction for order id: ${order_id} ---`);
        if (existingTransaction) {
            await updateTransactionStatus(existingTransaction.id, "Paid", razorpay_payment_id);
        } else {
            await createTransactionForOrderId(order_id, provider.id, order.amount, "paid", razorpay_payment_id, "Paid");
        }
        logger.info(`--- Transaction recorded successfully ---`);

        return returnResponse(res, StatusCodes.OK, `Provider subscription created successfully`, { branches: total_branches, provider_subscription: finalModuleSubscritptionPlans });

    } catch (error) {
        logger.error(`--- Error in createProviderSubscriptionEndpoint: ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in createProviderSubscriptionEndpoint: ${error}`);
    }
}

export { createProviderSubscriptionEndpoint };