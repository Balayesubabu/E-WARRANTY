import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { generateJWT } from "../../../services/generate-jwt-token.js";
import verifyOTP from "../../../services/verify-otp.js";
import { getCustomerByEmailOrPhoneNumber } from "./query.js";

const loginCustomerWithOtp = async (req, res) => {
  try {
    logger.info("loginCustomerWithOtp");
    const { email, phone_number, otp } = req.body;

    if ((!email && !phone_number) || !otp) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "Email or phone number and OTP are required"
      );
    }

    const user = await getCustomerByEmailOrPhoneNumber(email, phone_number);
    if (!user) {
      return returnError(res, StatusCodes.NOT_FOUND, "User not found");
    }

    const isOTPCorrect = await verifyOTP(user, otp);
    if (!isOTPCorrect) {
      return returnError(res, StatusCodes.UNAUTHORIZED, "OTP is incorrect");
    }

    const token = await generateJWT(user.id);
    if (!token) {
      return returnError(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "JWT token generation failed"
      );
    }

    return returnResponse(res, StatusCodes.OK, "Login successful", {
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
      },
    });
  } catch (error) {
    logger.error(`Error in loginCustomerWithOtp: ${error}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error, null);
  }
};

export { loginCustomerWithOtp };
