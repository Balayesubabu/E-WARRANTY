import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import getRazorpay from "../../../utils/razorpay.js";
import { getProviderByUserId } from "./query.js";

const createOrderSubscriptionEndpoint = async (req, res) => {
    try {
        logger.info(`CreateOrderSubscriptionEndpoint`); 
        const data = req.body;
        const user_id = req.user_id;

        const { amount, currency, receipt } = data; 
        
        if (!amount || amount <= 0) {
            logger.error(`--- Invalid amount: ${amount} ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Invalid amount provided`);
        }

        const options = {
            amount: Math.round(amount),
            currency: currency || "INR",
            receipt: receipt || `rcpt_${Date.now()}`
        };

        logger.info(`--- Order options: ${JSON.stringify(options)} ---`);

        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!razorpayKeyId || !razorpayKeySecret) {
            logger.error(`--- Razorpay credentials not configured. KEY_ID: ${razorpayKeyId ? 'SET' : 'NOT SET'}, SECRET: ${razorpayKeySecret ? 'SET' : 'NOT SET'} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Payment gateway not configured. Please contact support.`);
        }
        logger.info(`--- Razorpay credentials verified: KEY_ID starts with ${razorpayKeyId.substring(0, 12)}... ---`);

        logger.info(`--- Getting provider for user id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for user id: ${user_id}`);
        }
        logger.info(`--- Provider found for user id: ${user_id} ---`);

        logger.info(`--- Creating Razorpay order ---`);
        const order = await getRazorpay().orders.create(options);
        if (!order) {
            logger.error(`--- Error in creating order - null response ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in creating order`);
        }
        logger.info(`--- Order created successfully: ${order.id} ---`);
        return returnResponse(res, StatusCodes.OK, `Order created successfully`, order);
    } catch (error) {
        logger.error(`--- Error in CreateOrderSubscriptionEndpoint ---`);
        logger.error(`--- Error message: ${error.message || 'No message'} ---`);
        logger.error(`--- Error details: ${JSON.stringify(error.error || error, null, 2)} ---`);
        if (error.statusCode) {
            logger.error(`--- Razorpay status code: ${error.statusCode} ---`);
        }
        const errorMessage = error.error?.description || error.message || 'Payment order creation failed';
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);
    }
};

export { createOrderSubscriptionEndpoint };