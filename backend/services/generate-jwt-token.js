import { Staff, ProviderDealer, ServiceCenter, prisma } from "../prisma/db-models.js";
import { logger } from "./logger.js";
import jwt from "jsonwebtoken";

const getJwtExpiresIn = () => {
    const raw = process.env.JWT_EXPIRES_IN;
    if (!raw) return "30d";
    const trimmed = String(raw).trim();
    if (!trimmed) return "30d";

    // Allow either:
    // - seconds (e.g. 86400, 2592000)
    // - jsonwebtoken time span strings (e.g. "30d", "12h")
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
    return trimmed;
};


/** Map legacy user_type to RoleName when Role.code is not linked yet */
const roleFromUserType = (user_type) => {
    if (user_type === "super_admin") return "SUPER_ADMIN";
    if (user_type === "owner") return "BUSINESS_OWNER";
    if (user_type === "customer") return "CUSTOMER";
    return null;
};

const generateJWT = async (user_id) => {
    logger.info(`--- Generating JWT for user ${user_id} ---`);
    const user = await prisma.user.findUnique({
        where: { id: user_id },
        include: {
            canonical_role: true,
            sub_role: true,
        },
    });

    if (!user) {
        logger.info(`--- User ${user_id} not found ---`);
        throw new Error("User not found");
    }
    logger.info(`--- User ${user_id} found with data ${JSON.stringify(user)} ---`);

    const role =
        user.canonical_role?.code ??
        roleFromUserType(user.user_type) ??
        undefined;
    const subRole = user.sub_role?.code ?? null;

    const token = jwt.sign(
        {
            id: user.id,
            userId: user.id,
            email: user.email,
            phone_number: user.phone_number,
            role,
            subRole,
            legacyLoginRole: user.user_type ?? null,
        },
        process.env.JWT_SECRET,
        { expiresIn: getJwtExpiresIn() }
    );

    logger.info(`--- JWT generated for user ${user_id} ---`);
    return token;
};

const generateStaffJWT = async (user_id) => {
    logger.info(`--- Generating JWT for staff ${user_id} ---`);
    const user = await Staff.findUnique({
        where: {
            id: user_id
        }
    });

    if (!user) {
        logger.info(`--- Staff ${user_id} not found ---`);
        throw new Error("Staff not found");
    }
    logger.info(`--- Staff ${user_id} found with data ${JSON.stringify(user)} ---`);

    const token = jwt.sign(
        {
            id: user.id,
            userId: user.id,
            email: user.email,
            phone_number: user.phone,
            role: "BUSINESS_OWNER",
            subRole: "STAFF",
            legacyLoginRole: "staff",
        },
        process.env.JWT_SECRET,
        { expiresIn: getJwtExpiresIn() }
    );

    logger.info(`--- JWT generated for staff ${user_id} ---`);
    return token;
};

const generateDealerJWT = async (dealer_id) => {
    logger.info(`--- Generating JWT for dealer ${dealer_id} ---`);
    const dealer = await ProviderDealer.findUnique({
        where: {
            id: dealer_id
        }
    });

    if (!dealer) {
        logger.info(`--- Dealer ${dealer_id} not found ---`);
        throw new Error("Dealer not found");
    }
    logger.info(`--- Dealer ${dealer_id} found ---`);

    const token = jwt.sign(
        {
            id: dealer.id,
            userId: dealer.id,
            email: dealer.email,
            phone_number: dealer.phone_number,
            role: "BUSINESS_OWNER",
            subRole: "DEALER",
            legacyLoginRole: "dealer",
            provider_id: dealer.provider_id,
        },
        process.env.JWT_SECRET,
        { expiresIn: getJwtExpiresIn() }
    );

    logger.info(`--- JWT generated for dealer ${dealer_id} ---`);
    return token;
};

const generateServiceCenterJWT = async (service_center_id) => {
    logger.info(`--- Generating JWT for service center ${service_center_id} ---`);
    const sc = await ServiceCenter.findUnique({
        where: { id: service_center_id },
    });
    if (!sc) {
        logger.info(`--- Service center ${service_center_id} not found ---`);
        throw new Error("Service center not found");
    }
    const token = jwt.sign(
        {
            id: sc.id,
            userId: sc.id,
            email: sc.email,
            phone: sc.phone,
            role: "BUSINESS_OWNER",
            subRole: "SERVICE_CENTER",
            legacyLoginRole: "service_center",
            provider_id: sc.provider_id,
        },
        process.env.JWT_SECRET,
        { expiresIn: getJwtExpiresIn() }
    );
    logger.info(`--- JWT generated for service center ${service_center_id} ---`);
    return token;
};

export { generateJWT, generateStaffJWT, generateDealerJWT, generateServiceCenterJWT };