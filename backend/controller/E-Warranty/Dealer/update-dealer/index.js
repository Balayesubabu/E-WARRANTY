import { getProviderByUserId, getDealerById, updateDealer } from "./query.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
    sendDeactivationNotification,
    
    sendReactivationNotification,
} from "../../../../services/dealer-status-service.js";
import {
    normalizeEmailForIdentity,
    findGlobalEmailLoginConflict,
    GLOBAL_EMAIL_IN_USE_MESSAGE,
} from "../../../../utils/globalEmailIdentity.js";


const updateDealerEndpoint = async (req, res) => {
    try {
        logger.info(`updateDealerEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider by user id ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with user id: ${user_id} ---`);

        const dealer_id = req.params.dealer_id;
        const data = req.body;

        const existingDealer = await getDealerById(provider.id, dealer_id);
        if (!existingDealer) {
            logger.error(`--- Dealer not found: ${dealer_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Dealer not found`);
        }

        let {
            name,
            country_code,
            phone_number,
            email,
            pan_number,
            gst_number,
            address,
            pin_code,
            city,
            state,
            country,
            is_active,
            is_deleted,
        } = data;

        if (email !== undefined && email !== null && String(email).trim() !== "") {
            const emailNorm = normalizeEmailForIdentity(email);
            if (!emailNorm) {
                return returnError(res, StatusCodes.BAD_REQUEST, "Invalid email address");
            }
            const prevNorm = normalizeEmailForIdentity(existingDealer.email);
            if (emailNorm !== prevNorm) {
                const reserved = await findGlobalEmailLoginConflict(emailNorm, { excludeDealerId: dealer_id });
                if (reserved) {
                    return returnError(res, StatusCodes.CONFLICT, GLOBAL_EMAIL_IN_USE_MESSAGE, {
                        code: "GLOBAL_EMAIL_IN_USE",
                        existingRole: reserved,
                    });
                }
            }
            data.email = emailNorm;
        }

        if (is_deleted) {
            data.is_active = false;
        }
        logger.info(`--- Updating dealer with id: ${dealer_id} and data: ${JSON.stringify(data)} ---`);

        const updated_dealer = await updateDealer(provider.id, dealer_id, data);
        if (!updated_dealer) {
            logger.error(`--- Failed to update dealer with id: ${dealer_id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update dealer`);
        }
        logger.info(`--- Dealer updated with id: ${dealer_id} ---`);

        const wasActive = existingDealer.is_active === true || existingDealer.status === "ACTIVE";
        const isNowActive = updated_dealer.is_active === true || updated_dealer.status === "ACTIVE";

        if (wasActive && !isNowActive) {
            const reason = (data.reason || req.body?.reason || "").trim() || "Deactivated by provider.";
            const dealerForEmail = { name: updated_dealer.name, email: updated_dealer.email };
            sendDeactivationNotification(dealerForEmail, reason).catch((err) => {
                logger.error(`Deactivation email to dealer failed: ${err?.message || err}`);
            });
        } else if (!wasActive && isNowActive) {
            const dealerForEmail = { name: updated_dealer.name, email: updated_dealer.email };
            sendReactivationNotification(dealerForEmail).catch((err) => {
                logger.error(`Reactivation email to dealer failed: ${err?.message || err}`);
            });
        }

        return returnResponse(res, StatusCodes.OK, `Dealer updated successfully`, updated_dealer);
    } catch (error) {
        logger.error(`updateDealerEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update dealer`);
    }
}

export { updateDealerEndpoint };