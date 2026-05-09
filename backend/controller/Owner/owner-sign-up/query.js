import { Franchise, User, Owner } from "../../../prisma/db-models.js";
import { logger } from "../../../services/logger.js";
import { ensureBusinessOwnerRole } from "../../../utils/resolveCanonicalRole.js";

const getUserByEmailOrPhoneNumber = async (email, phone_number) => {
    const conditions = [];
    if (email) conditions.push({ email: { equals: email, mode: "insensitive" } });
    if (phone_number) conditions.push({ phone_number: phone_number });
    if (conditions.length === 0) return null;

    const user = await User.findFirst({
        where: {
            OR: conditions,
        },
    });
    return user;
};

const updatingUserAndCreatingOwner = async (user_id, data) => {
    const businessOwnerRole = await ensureBusinessOwnerRole();
    const user = await User.update({
        where: {
            id: user_id,
        },
        data: {
            first_name: data.first_name,
            last_name: data.last_name,
            country_code: data.country_code,
            email: data.email,
            phone_number: data.phone_number,
            password: data.hashed_password,
            address: data.address,
            is_active: true,
            user_type: "owner",
            role_id: businessOwnerRole.id,
            profile_completed: true,
        },
    });

    let owner = null;
    try {
        owner = await Owner.create({
            data: {
                user_id: user.id,
                company_name: data.company_name,
                company_address: data.company_address,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        country_code: true,
                        phone_number: true,
                        password: false,
                        date_of_birth: true,
                        profile_image: true,
                        address: true,
                        city: true,
                        state: true,
                        lattitude: true,
                        longitude: true,
                        user_type: true,
                        role_id: true,
                        profile_completed: true,
                        otp: true,
                        otp_expiry: true,
                        is_active: true,
                        is_blocked: true,
                        is_terms_and_conditions_accepted: true,
                        is_privacy_policy_accepted: true,
                        blocked_by_id: true,
                        is_deleted: true,
                        deleted_by_id: true,
                        created_at: true,
                        updated_at: true,
                    },
                },
            },
        });
    } catch (error) {
        logger.error(`--- Error in updatingUserAndCreatingOwner ${error} ---`);
        return null;
    }

    return owner ? owner : null;
};

const createFranchise = async (owner, data) => {
    const franchise = await Franchise.create({
        data: {
            name: data.franchise_name,
            address: data.franchise_address,
            city: data.franchise_city,
            state: data.franchise_state,
            country: data.franchise_country,
            pin_code: data.franchise_pin_code,
            phone_number: data.franchise_phone_number,
            email: data.franchise_email,
            provider_id: owner.id,
            created_by_id: owner.user_id,
        },
    });
    return franchise;
};

export { getUserByEmailOrPhoneNumber, updatingUserAndCreatingOwner, createFranchise };
