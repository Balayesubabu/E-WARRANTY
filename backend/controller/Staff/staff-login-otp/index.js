import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {generateStaffJWT} from "../../../services/generate-jwt-token.js";
import verifyStaffToken from "../../../services/verify-otp.js";
import { getStaffByEmailOrPhoneNumber,getFranchiseById } from "./query.js";

const staffOTPLogInEndPoint = async (req, res) => {
    try {
        logger.info("staffOTPLogInEndPoint");
        const { phone, otp } = req.body;

        logger.info(`--- Checking if phone number and OTP are provided ---`);
        if (!phone || !otp) {
            logger.info(`--- Phone number or OTP is not provided ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, "Phone number and OTP are required");
        }
        logger.info(`--- Phone number and OTP are provided ---`);

        logger.info(`--- Checking if user exists with phone number ${phone} ---`);
        const staff = await getStaffByEmailOrPhoneNumber(phone);

        if (!staff) {
            logger.info(`--- Staff does not exist with phone number ${phone} ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, "Staff does not exist");
        }
        logger.info(`--- Staff exists with phone number ${phone} ---`);

        if (staff.staff_status !== "ACTIVE" || !staff.is_active) {
            logger.error(`--- Staff account is deactivated ---`);
            return returnError(res, StatusCodes.FORBIDDEN, "Your account has been deactivated. Please contact your administrator.");
        }

        logger.info(`--- Checking if OTP is correct ---`);
        const isOTPCorrect = await verifyStaffToken(staff, otp);
        if (!isOTPCorrect) {
            logger.info(`--- OTP is incorrect ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, "OTP is incorrect");
        }
        logger.info(`--- OTP is correct ---`);

        logger.info(`--- Fetching franchise by id ---`);
        const franchises = await getFranchiseById(staff.franchise_id);
        if (!franchises) {
            logger.error(`--- Franchise is not available ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, `Franchise is not available`);
        }
        logger.info(`--- Franchise is available ---`);

        logger.info(`--- Generating JWT for staff ${staff.id} ---`);
        const token = await generateStaffJWT(staff.id);
        logger.info(`--- JWT generated for staff ${staff.id} ---`);

        return returnResponse(res, StatusCodes.OK, "Staff logged in successfully", { token,franchises });

    } catch (error) {
        logger.error(`--- Error in providerOTPLogIn ${error} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error, null);
    }
}

export { staffOTPLogInEndPoint };