import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import { generateJWT } from "../../../services/generate-jwt-token.js";
import { User } from "../../../prisma/db-models.js";

/**
 * POST /super-admin/login
 * Super Admin login with email and password only.
 * User must have user_type === "super_admin"
 */
const superAdminLoginEndpoint = async (req, res) => {
    try {
        logger.info("superAdminLoginEndpoint");
        const { email, password } = req.body;

        if (!email || !password) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Email and password are required");
        }

        const user = await User.findFirst({
            where: {
                email: { equals: email.trim(), mode: "insensitive" },
                user_type: "super_admin",
                is_active: true,
                is_blocked: false,
                is_deleted: false,
            },
        });

        if (!user) {
            return returnError(res, StatusCodes.UNAUTHORIZED, "Invalid email or password");
        }

        if (!user.password) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Password not set for this account");
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return returnError(res, StatusCodes.UNAUTHORIZED, "Invalid email or password");
        }

        const token = await generateJWT(user.id);

        return returnResponse(res, StatusCodes.OK, "Login successful", {
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                user_type: "super_admin",
            },
        });
    } catch (error) {
        logger.error(`superAdminLoginEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Login failed");
    }
};

export default superAdminLoginEndpoint;
