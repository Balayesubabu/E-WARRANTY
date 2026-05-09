import Razorpay from "razorpay";

let razorpayInstance = null;

const getRazorpay = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
        throw new Error("Razorpay credentials not configured");
    }
    if (!razorpayInstance) {
        razorpayInstance = new Razorpay({ key_id, key_secret });
    }
    return razorpayInstance;
};

export default getRazorpay;
