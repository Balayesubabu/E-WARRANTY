import { ProviderDealer } from "../../../prisma/db-models.js";

const getDealerById = async (dealer_id) => {
    const dealer = await ProviderDealer.findUnique({
        where: {
            id: dealer_id
        }
    });
    return dealer;
}

const updateDealerPassword = async (dealer_id, hashed_password) => {
    const dealer = await ProviderDealer.update({
        where: {
            id: dealer_id
        },
        data: {
            password: hashed_password,
            otp: null,
            otp_expiry: null
        }
    });
    return dealer;
}

export { getDealerById, updateDealerPassword };
