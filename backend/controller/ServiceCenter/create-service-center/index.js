import { StatusCodes } from "http-status-codes";
import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { ServiceCenter } from "../../../prisma/db-models.js";
import bcrypt from "bcrypt";
import { validateOptionalPortalPassword } from "../../../utils/passwordPolicy.js";
import {
    normalizeEmailForIdentity,
    findGlobalEmailLoginConflict,
    GLOBAL_EMAIL_IN_USE_MESSAGE,
} from "../../../utils/globalEmailIdentity.js";

const createServiceCenterEndpoint = async (req, res) => {
  try {
    logger.info("createServiceCenterEndpoint");

    if (req.type !== "provider" && req.type !== "staff") {
      return returnError(res, StatusCodes.FORBIDDEN, "Only owner or staff can create service centers");
    }

    const provider_id = req.provider_id;
    if (!provider_id) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const { name, email, phone, address, password } = req.body;
    if (!name || !email || !phone) {
      return returnError(res, StatusCodes.BAD_REQUEST, "name, email, and phone are required");
    }

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

    const existing = await ServiceCenter.findFirst({
      where: {
        provider_id,
        OR: [
          { email: { equals: emailNorm, mode: "insensitive" } },
          { phone },
        ],
        is_deleted: false,
      },
    });
    if (existing) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Service center with this email or phone already exists");
    }

    let hashedPassword = null;
    if (password) {
      const pwCheck = validateOptionalPortalPassword(password);
      if (!pwCheck.ok) {
        return returnError(res, StatusCodes.BAD_REQUEST, pwCheck.message);
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const sc = await ServiceCenter.create({
      data: {
        provider_id,
        name,
        email: emailNorm,
        phone: String(phone).trim(),
        address: address || null,
        password: hashedPassword,
        is_active: true,
      },
    });

    return returnResponse(res, StatusCodes.CREATED, "Service center created successfully", sc);
  } catch (error) {
    logger.error(`createServiceCenterEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create service center");
  }
};

export { createServiceCenterEndpoint };
