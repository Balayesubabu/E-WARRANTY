import { User } from "../../../prisma/db-models.js";

const getUserById = async (user_id) => {
    const user = await User.findFirst({
        where: { id: user_id }
    });
    return user;
}

const updateUserPassword = async (user_id, new_password) => {
    const updated_user = await User.update({
        where: { id: user_id },
        data: { password: new_password }
    });
    return updated_user;
}
export { getUserById, updateUserPassword };