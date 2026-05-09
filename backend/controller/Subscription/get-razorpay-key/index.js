import { returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getRazorpayKeyEndpoint = async (req, res) => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    if (!key_id) {
        return returnError(res, StatusCodes.SERVICE_UNAVAILABLE, "Payment service not configured");
    }
    return returnResponse(res, StatusCodes.OK, "Razorpay key", { key_id });
};

export { getRazorpayKeyEndpoint };
