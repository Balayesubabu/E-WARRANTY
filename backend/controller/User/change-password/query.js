import { User } from "../../../prisma/db-models.js";

const getUserById = async (user_id) => {
    const user = await User.findUnique({
        where: {
            id: user_id
        }
    })
    return user;
}

const updateUser = async (user_id, data) => {
    const user = await User.update({
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