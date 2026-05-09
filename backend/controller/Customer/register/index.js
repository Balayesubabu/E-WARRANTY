import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { createCustomer, getCustomerByEmailOrPhoneNumber } from "./query.js";
import {
  normalizeEmailForIdentity,
  findGlobalEmailLoginConflict,
  GLOBAL_EMAIL_IN_USE_MESSAGE,
} from "../../../utils/globalEmailIdentity.js";

const registerCustomer = async (req, res) => {
  try {
    logger.info("registerCustomer");
    const { email, phone_number, fullname, password, country_code } = req.body;
    const resolvedCountryCode = country_code || "+91";

    if (!email || !phone_number) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "Email and phone number are required",
        null
      );
    }

    if (!fullname) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "Full name is required",
        null
      );
    }

    if (!password) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "Password is required",
        null
      );
    }

    const existingUser = await getCustomerByEmailOrPhoneNumber(
      email,
      phone_number
    );
    if (existingUser) {
      return returnError(res, StatusCodes.CONFLICT, "User already exists", null);
    }

    const emailNorm = normalizeEmailForIdentity(email);
    if (emailNorm) {
      const reserved = await findGlobalEmailLoginConflict(emailNorm, {});
      if (reserved) {
        return returnError(res, StatusCodes.CONFLICT, GLOBAL_EMAIL_IN_USE_MESSAGE, {
          code: "GLOBAL_EMAIL_IN_USE",
          existingRole: reserved,
        });
      }
    }

    const nameParts = fullname.trim().split(/\s+/);
    const first_name = nameParts.shift();
    const last_name = nameParts.length ? nameParts.join(" ") : null;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createCustomer({
      first_name,
      last_name,
      email: emailNorm || String(email).trim().toLowerCase(),
      country_code: resolvedCountryCode,
      phone_number,
      password: hashedPassword,
    });

    return returnResponse(res, StatusCodes.CREATED, "User registered", {
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        country_code: user.country_code,
        phone_number: user.phone_number,
      },
    });
  } catch (error) {
    logger.error(`Error in registerCustomer: ${error}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error, null);
  }
};

export { registerCustomer };
