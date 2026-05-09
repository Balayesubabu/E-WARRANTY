import { Staff } from "../../../prisma/db-models.js";

const getUserById = async (user_id) => {
    const user = await Staff.findUnique({
        where: { id: user_id }
    });
    return user;
}

const updateUserPassword = async (user_id, new_password) => {
    const updated_user = await Staff.update({
        where: { id: user_id },
        data: { password: new_password }
    });
    return updated_user;
}
export { getUserById, updateUserPassword };