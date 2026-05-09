import { User } from "../../../prisma/db-models.js";

const getUserById = async (user_id) => {
    const user = await User.findUnique({
        where: {
            id: user_id,
        },
    });
    return user;
};

export { getUserById };
