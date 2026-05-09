import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getStaffByEmailOrPhoneNumber} from "./query.js";
import { generateOTPForStaff} from "../../../services/generate-otp.js";
import sendSMS from "../../../services/sms.js";

const generateStaffOTPEndpoint = async (req, res) => {
    try {
        logger.info("generateStaffOTPEndpoint");
        const { phone} = req.body;

        let staff = await getStaffByEmailOrPhoneNumber(phone);
        if (!staff) {
            logger.info(`--- User does not exist with phone number ${phone} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "User does not exist", null);
        }
        logger.info(`--- User exists with phone number ${phone} ---`);

        logger.info(`--- Generating OTP ---`);
        const otpData = await generateOTPForStaff(phone);

        if (!otpData) {
            logger.info(`--- OTP generation failed ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "OTP generation failed", { otp: false });
        }
        logger.info(`--- OTP generated and stored in database ---`);

        logger.info(`--- Sending OTP to user ---`);
        // const sendOTP = await sendSMS(staff.phone, 'Welcome to Sharyo. Please validate your phone number by entering the OTP ' + otpData.otp + '. --Team Sharyo');
        const sendOTP = await sendSMS(staff.phone,'Phone+Validation+From+GVCC&var1='+otpData.otp);

        if (!sendOTP) {
            logger.info(`--- OTP sending failed ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "OTP sending failed", { otp: false });
        }
        logger.info(`--- OTP sent to user ---`);

        return returnResponse(res, StatusCodes.OK, "OTP generated and stored in database", { otp: true });

    } catch (error) {
        logger.error(error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error, null);
    }
}

export { generateStaffOTPEndpoint };