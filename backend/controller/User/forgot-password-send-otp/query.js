import { User } from "../../../prisma/db-models.js";

const getUserByEmailOrPhoneNumber = async (email, phone_number) => {
    const conditions = [];
    if (email) conditions.push({ email: email });
    if (phone_number) conditions.push({ phone_number: phone_number });
    if (conditions.length === 0) return null;

    const user = await User.findFirst({
        where: {
            OR: conditions
        }
    });
    return user;
}

export { getUserByEmailOrPhoneNumber };