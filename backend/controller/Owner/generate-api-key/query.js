import { User } from "../../../prisma/db-models.js";

const getUserById = async (user_id) => {
    const user = await User.findUnique({
        where: {
            id: user_id,
        },
    });
    return user;
};

const updateUser = async (user_id, data) => {
    const user = await User.update({
        where: {
            id: user_id,
        },
        data: {
            api_key: data.api_key,
            is_api_key_generated: data.is_api_key_generated,
            is_api_key_active: data.is_api_key_active,
        },
    });
    return user;
};

export { getUserById, updateUser };
