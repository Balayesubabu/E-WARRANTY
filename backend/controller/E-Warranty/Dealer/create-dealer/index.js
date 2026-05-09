import { sendEmail } from "../../../../services/email.js";
import { getProviderByUserId, getProviderByIdMinimal, getDealerByProviderId, createDealer } from "./query.js";
import { generateNanoId } from "../../../../services/generate-nano-id.js";
import { StatusCodes } from "http-status-codes";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import bcrypt from "bcrypt";
import { debitForAction, checkBalance } from "../../../../services/coinService.js";
import { validateOptionalPortalPassword } from "../../../../utils/passwordPolicy.js";
import {
    normalizeEmailForIdentity,
    findGlobalEmailLoginConflict,
    GLOBAL_EMAIL_IN_USE_MESSAGE,
} from "../../../../utils/globalEmailIdentity.js";

const createDealerEndpoint = async (req, res) => {
    try {
        logger.info(`createDealerEndpoint`);

        // Provider (owner) or staff with Dealers ability can create dealers
        if (req.type !== "provider" && req.type !== "staff") {
            return returnError(res, StatusCodes.FORBIDDEN, `Only owner or staff can create dealers`);
        }

        let provider;
        if (req.type === "staff") {
            provider = await getProviderByIdMinimal(req.provider_id);
        } else {
            const full = await getProviderByUserId(req.user_id);
            provider = full
                ? { id: full.id, company_name: full.company_name }
                : null;
        }
        if (!provider || !provider.id) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        const providerLabel = (provider.company_name || "").trim() || "your organization";
        logger.info(`--- Provider found with id: ${provider.id} (${providerLabel}) ---`);

        // Check coin balance before creating dealer
        const coinCheck = await checkBalance(provider.id, "CREATE_DEALER", 1);
        if (!coinCheck.allowed) {
            logger.warn(`Insufficient coins for CREATE_DEALER: ${coinCheck.current} < ${coinCheck.required}`);
            return returnError(
                res, 
                StatusCodes.PAYMENT_REQUIRED, 
                `Insufficient coins. You need ${coinCheck.required} coins to create a dealer. Current balance: ${coinCheck.current}.`,
                { 
                    error_code: "INSUFFICIENT_COINS",
                    required: coinCheck.required,
                    current: coinCheck.current
                }
            );
        }

        const data = req.body;

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

        const emailNorm = normalizeEmailForIdentity(email);
        if (!emailNorm) {
            return returnError(res, StatusCodes.BAD_REQUEST, "A valid email address is required");
        }
        const emailConflict = await findGlobalEmailLoginConflict(emailNorm, {});
        if (emailConflict) {
            return returnError(res, StatusCodes.CONFLICT, GLOBAL_EMAIL_IN_USE_MESSAGE, {
                code: "GLOBAL_EMAIL_IN_USE",
                existingRole: emailConflict,
            });
        }
        data.email = emailNorm;
        email = emailNorm;

        logger.info(`--- Checking for if dealer already exists for provider with id: ${provider.id} ---`);
        const dealer = await getDealerByProviderId(provider.id, phone_number, email);
        if (dealer) {
            logger.error(`--- Dealer already exists for provider with id: ${provider.id} ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Dealer already exists for provider`);
        }
        logger.info(`--- Dealer does not exist for provider with id: ${provider.id} ---`);

        logger.info(`--- Generating dealer key ---`);
        const dealer_key = generateNanoId("AlphaNumeric", 10);
        logger.info(`--- Dealer key generated: ${dealer_key} ---`);

        // Hash the password before storing
        let hashed_password = null;
        if (data.password) {
            const pwCheck = validateOptionalPortalPassword(data.password);
            if (!pwCheck.ok) {
                return returnError(res, StatusCodes.BAD_REQUEST, pwCheck.message);
            }
            logger.info(`--- Hashing dealer password ---`);
            hashed_password = await bcrypt.hash(data.password, 10);
            logger.info(`--- Dealer password hashed ---`);
        }

        logger.info(`--- Creating dealer ---`);
        const created_dealer = await createDealer(provider.id, dealer_key, data, hashed_password);
        if (!created_dealer) {
            logger.error(`--- Failed to create dealer ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create dealer`);
        }
        logger.info(`--- Dealer created: ${created_dealer.id} ---`);

        // Deduct coins for creating dealer
        try {
            await debitForAction(
                provider.id, 
                "CREATE_DEALER", 
                `Created dealer: ${data.name || data.email}`,
                1,
                { reference_id: created_dealer.id, reference_type: "dealer" }
            );
            logger.info(`--- Coins debited for dealer creation ---`);
        } catch (coinError) {
            logger.error(`Failed to debit coins: ${coinError.message}`);
        }

        const passwordLine = data.password
            ? `Password: ${data.password}\n`
            : "";

        const message =
            `Hello,\n\n` +
            `Your dealer account for ${providerLabel} has been created.\n\n` +
            `Email: ${email}\n` +
            passwordLine +
            `Dealer Key: ${dealer_key}\n\n` +
            `Thanks,\n` +
            `E-Warrantify Team`;

        // Send email in background (non-blocking) for faster response
        sendEmail(email, "Your Dealer Account is Ready", message)
            .then(() => logger.info(`--- Dealer registration email sent to ${email} ---`))
            .catch(err => logger.error(`Failed to send dealer registration email: ${err.message}`));

        return returnResponse(res, StatusCodes.OK, `Dealer created successfully`, created_dealer);

    } catch (error) {
        logger.error(`createDealerEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create dealer`);
    }
}

export { createDealerEndpoint };