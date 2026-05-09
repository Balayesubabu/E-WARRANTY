import { ProviderDealer } from "../../../prisma/db-models.js";

const getDealerByEmailOrPhoneNumber = async (email, phone_number) => {
    const conditions = [];
    if (email) conditions.push({ email: email });
    if (phone_number) conditions.push({ phone_number: phone_number });
    if (conditions.length === 0) return null;

    const dealer = await ProviderDealer.findFirst({
        where: {
            OR: conditions
        }
    });
    return dealer;
}

export { getDealerByEmailOrPhoneNumber };
