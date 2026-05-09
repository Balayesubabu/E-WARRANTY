import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getDealerById, createDealerNotification } from "./query.js";
import { sendEmail } from "../../../../services/email.js";

const contactDealerEndpoint = async (req, res) => {
    try {
        logger.info(`contactDealerEndpoint`);
        const { dealer_id, name, email, contact_number, message, country } = req.body;

        if (!dealer_id || !name || !email || !contact_number || !message) {
            logger.error(`--- Dealer id, name, email, contact number, and message are required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Dealer id, name, email, contact number, and message are required`);
        }

        logger.info(`--- Checking if dealer exists with id: ${dealer_id} ---`);
        const dealer = await getDealerById(dealer_id);
        if (!dealer) {
            logger.error(`--- Dealer not found with id: ${dealer_id} ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Dealer not found`);
        }
        logger.info(`--- Dealer found with id: ${dealer_id} ---`);

        logger.info(`--- Creating dealer notification with data: ${JSON.stringify(req.body)} ---`);
        const dealerNotification = await createDealerNotification(dealer.provider.id, dealer_id, name, email, contact_number, message, country);
        if (!dealerNotification) {
            logger.error(`--- Failed to create dealer notification ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Failed to create dealer notification`);
        }
        logger.info(`--- Dealer notification created with id: ${dealerNotification.id} ---`);

        logger.info(`--- Sending dealer notification to dealer ---`);
        const dealer_mail = sendEmail(dealer.provider.user.email, "Dealer Notification", `Name: ${name}\nEmail: ${email}\nContact Number: ${contact_number}\nMessage: ${message}\n${country ? `Country: ${country}` : ""}`);
        if (!dealer_mail) {
            logger.error(`--- Failed to send dealer notification ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Failed to send dealer notification`);
        }
        logger.info(`--- Dealer notification sent to dealer ---`);

        logger.info(`--- Sending dealer notification to provider ---`);
        const provider_mail = sendEmail(dealer.provider.user.email, "Provider Dealer Notification", `Dealer Name : ${dealer.name}\nName: ${name}\nEmail: ${email}\nContact Number: ${contact_number}\nMessage: ${message}\n${country ? `Country: ${country}` : ""}`);
        if (!provider_mail) {
            logger.error(`--- Failed to send dealer notification to provider ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Failed to send dealer notification to provider`);
        }
        logger.info(`--- Dealer notification sent to provider ---`);

        return returnResponse(res, StatusCodes.OK, `Dealer notification sent successfully`);
    } catch (error) {
        logger.error(`contactDealerEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to contact dealer`);
    }
}

export { contactDealerEndpoint };