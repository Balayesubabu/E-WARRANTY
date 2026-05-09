import { sendEmail } from "../../../services/email.js";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const MAX_MESSAGE_LEN = 5000;

const landingContactEndpoint = async (req, res) => {
  try {
    const { firstName, lastName, corporateEmail, message } = req.body || {};

    const fn = (firstName || "").trim();
    const ln = (lastName || "").trim();
    const email = (corporateEmail || "").trim();
    const msg = (message || "").trim();

    if (!fn || !ln || !email || !msg) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "First name, last name, corporate email, and message are required"
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Invalid email address");
    }

    if (msg.length > MAX_MESSAGE_LEN) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Message must be at most ${MAX_MESSAGE_LEN} characters`
      );
    }

    const to = process.env.LANDING_CONTACT_EMAIL;
    if (!to) {
      logger.error("LANDING_CONTACT_EMAIL is not set");
      return returnError(
        res,
        StatusCodes.SERVICE_UNAVAILABLE,
        "Contact form is not configured"
      );
    }

    const bodyText = [
      "New inquiry from the website contact form",
      "",
      `Name: ${fn} ${ln}`,
      `Email: ${email}`,
      "",
      "Message:",
      msg,
    ].join("\n");

    const result = await sendEmail(to, "eWarrantyfy — Website inquiry", bodyText);

    if (result && result.skipped) {
      return returnError(
        res,
        StatusCodes.SERVICE_UNAVAILABLE,
        "Email could not be sent. Please try again later."
      );
    }

    return returnResponse(res, StatusCodes.OK, "Inquiry sent successfully", null);
  } catch (error) {
    logger.error(`landingContactEndpoint error: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to send inquiry"
    );
  }
};

export { landingContactEndpoint };