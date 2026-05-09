import { User } from "../../../prisma/db-models.js";

const getUserById = async (user_id) => {
    const user = await User.findUnique({
        where: { id: user_id },
    });
    return user;
};

const updateUserPassword = async (user_id, hashed_password) => {
    const user = await User.update({
        where: { id: user_id },
        data: { password: hashed_password },
    });
    return user;
};

export { getUserById, updateUserPassword };
