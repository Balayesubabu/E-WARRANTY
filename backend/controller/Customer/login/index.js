import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { generateJWT } from "../../../services/generate-jwt-token.js";
import { getCustomerByEmailOrPhoneNumber } from "./query.js";

const loginCustomer = async (req, res) => {
  try {
    logger.info("loginCustomer");
    const { email, phone_number, password } = req.body;

    if (!email && !phone_number) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "Email or phone number is required"
      );
    }

    if (!password) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Password is required");
    }

    const user = await getCustomerByEmailOrPhoneNumber(email, phone_number);
    if (!user) {
      return returnError(res, StatusCodes.NOT_FOUND, "User not found");
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return returnError(res, StatusCodes.UNAUTHORIZED, "Invalid password");
    }

    const token = await generateJWT(user.id);
    console.log("Customer Token", token)
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
        user_type: user.user_type,
      },
    });
  } catch (error) {
    logger.error(`Error in loginCustomer: ${error}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error, null);
  }
};

export { loginCustomer };
