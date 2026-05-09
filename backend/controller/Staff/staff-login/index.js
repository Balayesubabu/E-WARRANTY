import {generateStaffJWT} from "../../../services/generate-jwt-token.js";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getStaffByEmailOrPhone,getFranchiseById } from "./query.js";
import bcrypt from "bcrypt";


const staffLoginEndpoint = async (req, res) => {
    try {
        logger.info(`StaffLoginEndpoint`);
        const { email, phone, password } = req.body;

        logger.info(`--- Fetching staff by email or phone ---`);
        const staff = await getStaffByEmailOrPhone(email, phone);
        if (!staff) {
            logger.error(`--- Staff not found with email or phone ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Staff not found`);
        }
        logger.info(`--- Staff found with email or phone ---`);

        if (staff.staff_status !== "ACTIVE" || !staff.is_active) {
            logger.error(`--- Staff account is deactivated ---`);
            return returnError(res, StatusCodes.FORBIDDEN, `Your account has been deactivated. Please contact your administrator.`);
        }
        if (staff.provider?.is_blocked) {
            logger.error(`--- Provider account is blocked (provider_id: ${staff.provider_id}) ---`);
            return returnError(res, StatusCodes.FORBIDDEN, `Your organization's account has been blocked. Please contact support.`);
        }

        logger.info(`--- Checking if password is correct ---`);
        const is_password_correct = await bcrypt.compare(password, staff.password);
        if (!is_password_correct) {
            logger.error(`--- Password is incorrect ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, `Password is incorrect`);
        }
        logger.info(`--- Password is correct ---`);

        logger.info(`--- Fetching franchise by id ---`);
        const franchises = await getFranchiseById(staff.franchise_id);
        if (!franchises) {
            logger.error(`--- Franchise is not available ---`);
            return returnError(res, StatusCodes.UNAUTHORIZED, `Franchise is not available`);
        }
        logger.info(`--- Franchise is available ---`);

        logger.info(`--- Creating token ---`);
        const token = await generateStaffJWT(staff.id);
        logger.info(`--- Token created ---`);

        logger.info(`--- Returning token ---`);
        return returnResponse(res, StatusCodes.OK, `Staff login successful`, {
            token, franchises,
            staffProfile: {
                id: staff.id,
                name: staff.name,
                email: staff.email,
                phone: staff.phone,
                role_type: staff.role_type,
                department: staff.department,
                region: staff.region,
                employee_id: staff.employee_id,
                staff_status: staff.staff_status,
                designation: staff.designation,
            }
        });
    } catch (error) {
        logger.error(`--- Error in staff login ---`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in staff login`, error);
    }
}

export { staffLoginEndpoint };