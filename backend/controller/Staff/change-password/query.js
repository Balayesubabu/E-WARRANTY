import { Staff } from "../../../prisma/db-models.js";

const getUserById = async (user_id) => {
    const user = await Staff.findUnique({
        where: {
            id: user_id
        }
    })
    return user;
}

const updateUser = async (user_id, data) => {
    const user = await Staff.update({
        where: {
            id: user_id
        },
        data: {
            password: data.password
        }
    })
    return user;
}

export { getUserById, updateUser };