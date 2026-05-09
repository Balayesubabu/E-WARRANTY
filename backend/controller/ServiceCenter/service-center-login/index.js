import { generateServiceCenterJWT } from "../../../services/generate-jwt-token.js";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getServiceCenterByEmailOrPhone, getFranchiseByProviderId } from "./query.js";
import bcrypt from "bcrypt";

const serviceCenterLoginEndpoint = async (req, res) => {
  try {
    logger.info("serviceCenterLoginEndpoint");
    const { email, phone, password } = req.body;

    const sc = await getServiceCenterByEmailOrPhone(email?.toLowerCase()?.trim(), phone);
    if (!sc) {
      return returnError(res, StatusCodes.NOT_FOUND, "Service center account not found");
    }

    if (!sc.password) {
      return returnError(res, StatusCodes.UNAUTHORIZED, "Account not activated. Please set your password first.");
    }

    const isPasswordCorrect =
      sc.password.startsWith("$2a$") || sc.password.startsWith("$2b$")
        ? await bcrypt.compare(password, sc.password)
        : password === sc.password;

    if (!isPasswordCorrect) {
      return returnError(res, StatusCodes.UNAUTHORIZED, "Password is incorrect");
    }

    if (sc.provider?.is_blocked) {
      return returnError(res, StatusCodes.FORBIDDEN, "Your organization's account has been blocked. Please contact support.");
    }

    if (password === sc.password && !sc.password.startsWith("$2")) {
      const { ServiceCenter } = await import("../../../prisma/db-models.js");
      const hashed = await bcrypt.hash(password, 10);
      await ServiceCenter.update({ where: { id: sc.id }, data: { password: hashed } });
      logger.info(`Migrated service center ${sc.id} password to bcrypt`);
    }

    const franchise = await getFranchiseByProviderId(sc.provider_id);
    const token = await generateServiceCenterJWT(sc.id);

    return returnResponse(res, StatusCodes.OK, "Service center login successful", {
      token,
      franchise,
      serviceCenter: {
        id: sc.id,
        name: sc.name,
        email: sc.email,
        phone: sc.phone,
        provider_id: sc.provider_id,
      },
    });
  } catch (error) {
    logger.error(`Error in service center login: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error in service center login", error);
  }
};

export { serviceCenterLoginEndpoint };
