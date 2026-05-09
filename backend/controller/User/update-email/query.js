import { User } from "../../../prisma/db-models.js";

const getUserById = async (user_id) => {
    const user = await User.findUnique({
        where: { id: user_id }
    });
    return user;
};

const getUserByEmail = async (email) => {
    const user = await User.findFirst({
        where: {
            email: {
                equals: email,
                mode: 'insensitive'
            }
        }
    });
    return user;
};

const updateUserEmail = async (user_id, email) => {
    const user = await User.update({
        where: { id: user_id },
        data: {
            email: email,
            updated_at: new Date()
        }
    });
    return user;
};

export { getUserById, getUserByEmail, updateUserEmail };
