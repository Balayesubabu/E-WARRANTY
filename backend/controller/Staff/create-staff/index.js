import { sendEmail } from "../../../services/email.js";
import { logger } from "../../../services/logger.js";
import { returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getStaffByEmailAndPhone, createStaff, getModuleById, getSubModuleById} from "./query.js";
import bcrypt from "bcrypt";
import { assertRequiredPortalPassword } from "../../../utils/passwordPolicy.js";
import {
    normalizeEmailForIdentity,
    findGlobalEmailLoginConflict,
    GLOBAL_EMAIL_IN_USE_MESSAGE,
} from "../../../utils/globalEmailIdentity.js";

const createStaffEndpoint = async (req, res) => {
    try {
        logger.info(`CreateStaffEndpoint`);

        // Only provider can create staff members
        if (req.type && req.type !== 'provider') {
            return returnError(res, StatusCodes.FORBIDDEN, `Only the provider can create staff members`);
        }

        const user_id = req.user_id;
        const franchise_id = req.franchise_id;
         
        
        const data = req.body;
        const {
            name,
            email,
            phone,
            address,
            password,
            designation,
            role_type,
            department_id,
            sub_module_ids_permissions
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

        logger.info(`--- Fetching provider by user id ---`);
        const provider = await getProviderByUserId(user_id);
        console.log(provider);
        if (!provider) {
            logger.error(`--- Provider not found with user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with user id: ${user_id} ---`);

        logger.info(`--- Checking if provider already has staff with email: ${emailNorm} and phone: ${phone} on franchise: ${franchise_id} ---`);
        const staff = await getStaffByEmailAndPhone(provider.id, emailNorm, phone, franchise_id);
        if (staff) {
            logger.error(`--- Staff already exists with email: ${email} and phone: ${phone} ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Staff already exists`);
        }
        logger.info(`--- Staff does not exist with email: ${email} and phone: ${phone} ---`);

        const pwCheck = assertRequiredPortalPassword(password);
        if (!pwCheck.ok) {
            return returnError(res, StatusCodes.BAD_REQUEST, pwCheck.message);
        }

        logger.info(`--- Hashing password ---`);
        const hashed_password = await bcrypt.hash(password, 10);
        logger.info(`--- Hashed password : ${hashed_password} ---`);

        logger.info(`--- Creating staff role and permissions ---`); 
        let processed_sub_module_ids_permissions = [];
        for (const sub_module_id_permission of sub_module_ids_permissions) {
            let {
                sub_module_id,
                module_id,
                access_type
            } = sub_module_id_permission;

            console.log("sub module id ", sub_module_id);

            if (sub_module_id) {
                logger.info(`--- Fetching sub module by id : ${sub_module_id} ---`);
                const sub_module = await getSubModuleById(sub_module_id);
                if (!sub_module) {
                    logger.error(`--- Sub module not found ---`);
                    return returnError(res, StatusCodes.NOT_FOUND, `Sub module not found`);
                }
                logger.info(`--- Sub module found ---`);
                processed_sub_module_ids_permissions.push({
                    sub_module_id: sub_module.id,
                    module_id: sub_module.module_id,
                    access_type: access_type
                })
            }

            if (!sub_module_id && module_id) {
                logger.info(`--- Fetching module by id : ${module_id} ---`);
                const module = await getModuleById(module_id);
                if (!module) {
                    logger.error(`--- Module not found ---`);
                    return returnError(res, StatusCodes.NOT_FOUND, `Module not found`);
                }
                logger.info(`--- Module found ---`);
                processed_sub_module_ids_permissions.push({
                    module_id: module.id,
                    access_type: access_type
                })
            }
        }
        logger.info(`--- Created staff role and permissions ---`); 
        let provider_id = provider.id;
        const providerLabel = (provider.company_name || "").trim() || "your organization";

        const created_staff = await createStaff(provider_id, franchise_id, data, hashed_password,processed_sub_module_ids_permissions);
        if (!created_staff) {
            logger.error(`--- Error in creating staff ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in creating staff`);
        }
        logger.info(`--- Staff created successfully ---`);

        const email_text =
            `Hello,\n\n` +
            `Your staff account for ${providerLabel} has been created successfully.\n\n` +
            `Email: ${emailNorm}\n` +
            `Password: ${password}\n\n` +
            `Thanks,\n` +
            `E-Warrantify Team`;

        sendEmail(emailNorm, "Your Staff Account is Ready", email_text)
            .then(() => logger.info(`--- Account details sent to staff at ${emailNorm} ---`))
            .catch(err => logger.error(`Failed to send staff account email to ${emailNorm}: ${err.message}`));

        return returnResponse(res, StatusCodes.OK, `Staff created successfully`, { created_staff});
    } catch (error) {
        logger.error(`--- Error in creating staff ---`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in creating staff`, error);
    }
}

export { createStaffEndpoint };