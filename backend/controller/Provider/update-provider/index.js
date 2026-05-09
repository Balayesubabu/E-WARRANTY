import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getProviderByUserId, updateProvider } from "./query.js";
import { StatusCodes } from "http-status-codes";
import { User } from "../../../prisma/db-models.js";
import { normalizeIndianMobile, isValidIndianMobile } from "../../../utils/indianMobile.js";
import { giveProfileCompletionBonus, checkProfileCompletion } from "../../../services/coinService.js";

const updateProviderEndpoint = async (req, res) => {
    try {
        logger.info(`UpdateProviderEndpoint`);
        const user_id = req.user_id;

        logger.info(`--- Checking if user id: ${user_id} is provider ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for user id: ${user_id}`);
        }
        logger.info(`--- Provider found for user id: ${user_id} ---`);

        const data = req.body;
        const {
            company_name,
            company_address,
            company_website,
            company_description,
            facebook_url,
            instagram_url,
            youtube_url,
            achivements,
            mode_of_service_offered,
            post_code,
            gst_number,
            first_name,
            last_name,
            phone_number,
            fullname,
            personal_address,
            country_code,
        } = data;

        // Optional: update User name/phone (e.g. for complete-profile flow)
        const userUpdate = { profile_completed: true, updated_at: new Date() };
        if (first_name !== undefined || last_name !== undefined || fullname !== undefined) {
            if (fullname && (first_name === undefined && last_name === undefined)) {
                const parts = String(fullname).trim().split(/\s+/);
                userUpdate.first_name = parts[0] || null;
                userUpdate.last_name = parts.slice(1).join(" ") || null;
            } else {
                if (first_name !== undefined) userUpdate.first_name = first_name || null;
                if (last_name !== undefined) userUpdate.last_name = last_name || null;
            }
        }
        if (phone_number !== undefined) {
            if (phone_number === null || String(phone_number).trim() === "") {
                userUpdate.phone_number = null;
            } else {
                const normalizedPhone = normalizeIndianMobile(phone_number);
                if (!isValidIndianMobile(normalizedPhone)) {
                    return returnError(
                        res,
                        StatusCodes.BAD_REQUEST,
                        "Enter a valid 10-digit Indian mobile number (starting with 6–9)."
                    );
                }
                userUpdate.phone_number = normalizedPhone;
                userUpdate.country_code =
                    country_code != null && String(country_code).trim() !== ""
                        ? String(country_code).trim()
                        : "+91";
            }
        }
        if (personal_address !== undefined) {
            const pa = personal_address === null ? "" : String(personal_address).trim();
            userUpdate.address = pa === "" ? null : pa;
        }

        // Enforce unique phone number with a friendly error.
        if (userUpdate.phone_number) {
            const existing = await User.findFirst({
                where: {
                    phone_number: userUpdate.phone_number,
                    id: { not: user_id },
                },
                select: { id: true },
            });
            if (existing) {
                return returnError(
                    res,
                    StatusCodes.CONFLICT,
                    "This phone number is already registered. Please use a different phone number."
                );
            }
        }
        await User.update({ where: { id: user_id }, data: userUpdate });

        logger.info(`--- Updating provider for user id: ${user_id} ---`);
        const updatedProvider = await updateProvider(user_id, data);
        if (!updatedProvider) {
            logger.error(`--- Provider not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for user id: ${user_id}`);
        }
        logger.info(`--- Provider updated for user id: ${user_id} ---`);

        // ═══════════════════════════════════════════════════════════════
        // COINS: Check and give profile completion bonus if eligible
        // ═══════════════════════════════════════════════════════════════
        let profileBonusResult = null;
        try {
            const profileStatus = await checkProfileCompletion(provider.id);
            if (profileStatus.complete) {
                logger.info(`--- Profile complete for provider ${provider.id}, checking bonus eligibility ---`);
                profileBonusResult = await giveProfileCompletionBonus(provider.id);
                if (profileBonusResult.success) {
                    logger.info(`--- Profile completion bonus of ${profileBonusResult.bonus} coins given to provider ${provider.id} ---`);
                }
            }
        } catch (bonusError) {
            logger.error(`--- Failed to check/give profile bonus: ${bonusError.message} ---`);
        }

        return returnResponse(res, StatusCodes.OK, `Provider updated for user id: ${user_id}`, {
            ...updatedProvider,
            profile_bonus: profileBonusResult
        });

    } catch (error) {
        logger.error(`Error in updateProviderEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updateProviderEndpoint: ${error}`);
    }
}

export { updateProviderEndpoint };