import { Staff } from "../../../prisma/db-models.js";

const getStaffByEmailOrPhoneNumber = async (email, phone_number) => {
    const conditions = [];
    if (email) conditions.push({ email: email });
    if (phone_number) conditions.push({ phone: phone_number });
    if (conditions.length === 0) return null;

    const user = await Staff.findFirst({
        where: {
            OR: conditions
        }
    });
    return user;
}

export { getStaffByEmailOrPhoneNumber };