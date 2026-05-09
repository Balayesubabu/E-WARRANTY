import { User } from "../../../prisma/db-models.js";

const getUserByEmailOrPhoneNumber = async (email, phone_number) => {
    const conditions = [];
    if (email) conditions.push({ email: { equals: email, mode: 'insensitive' } });
    if (phone_number) conditions.push({ phone_number: phone_number });
    if (conditions.length === 0) return null;

    const user = await User.findFirst({
        where: {
            OR: conditions
        }
    });
    return user;
}

const normalizeStoredEmail = (e) => (e ? String(e).trim().toLowerCase() : null);

const createUser = async (email, phone_number, country_code) => {
    if (phone_number) {
        const user = await User.create({
            data: {
                phone_number: phone_number,
                ...(country_code && { country_code: country_code }),
                ...(email && { email: normalizeStoredEmail(email) }),
            }
        })
        return user;
    } else if (email) {
        const user = await User.create({
            data: {
                email: normalizeStoredEmail(email),
                ...(country_code && { country_code: country_code }),
            }
        })
        return user;
    } else {
        return null;
    }
}
export { getUserByEmailOrPhoneNumber, createUser };