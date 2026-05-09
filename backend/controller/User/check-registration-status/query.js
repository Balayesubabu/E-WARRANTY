import { User, Provider } from "../../../prisma/db-models.js";

const getUserByEmail = async (email) => {
    if (!email) return null;
    const user = await User.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
    });
    return user;
};

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id },
    });
    return provider;
};

export { getUserByEmail, getProviderByUserId };
