import { sendEmail } from "../../../services/email.js";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderById, createProviderNotification } from "./query.js";

const contactMeEndpoint = async (req, res) => {
    try {
        logger.info(`ContactmeEndpoint`)
        const { provider_id, name, contact_number, email, message, country } = req.body;

        if (!name || !contact_number || !email || !message) {
            logger.info(`--- Name, Contact Number, Email, and Message are required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Name, contact number, email, and message are required`);
        }

        logger.info(`--- Checking if Provider exists with id : ${provider_id} ---`);

        const provider = await getProviderById(provider_id);

        if (!provider) {
            logger.info(`--- Provider not found with id : ${provider_id} ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Provider not found`);
        }

        logger.info(`--- Provider found with id : ${provider_id} ---`);

        logger.info(`--- Creating provider notification with data : ${JSON.stringify(req.body)} ---`);
        const providerNotification = await createProviderNotification(provider.id, name, contact_number, email, message, country);
        if (!providerNotification) {
            logger.info(`--- Failed to create provider notification ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Failed to create provider notification`);
        }

        logger.info(`--- Provider notification created with id : ${providerNotification.id} ---`);


        logger.info(`--- Sending contact details to provider ---`);

        const mail = sendEmail(provider.user.email, "Contact Me", `Name: ${name}\nContact Number: ${contact_number}\nEmail: ${email}\nMessage: ${message}\n${country ? `Country: ${country}` : ""}`);

        if (!mail) {
            logger.info(`--- Failed to send email ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Failed to send email`);
        }

        logger.info(`--- Email sent successfully ---`);
        return returnResponse(res, StatusCodes.OK, `Email sent successfully`);
    } catch (error) {
        logger.error(`contactMeEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to contact me`);
    }
}

export { contactMeEndpoint };