import { User, Owner } from "../../../prisma/db-models.js";

const getUserById = async (user_id) => {
    const user = await User.findUnique({
        where: { id: user_id },
        include: {
            Provider: true
        }
    });
    return user;
};

const updateUserDetails = async (user_id, data) => {
    const updateData = {
        first_name: data.first_name,
        last_name: data.last_name,
        address: data.address,
        profile_completed: true,
        updated_at: new Date()
    };

    // Only include phone_number if it's being changed
    if (data.phone_number !== undefined) {
        updateData.phone_number = data.phone_number;
    }

    const user = await User.update({
        where: { id: user_id },
        data: updateData
    });
    return user;
};

const updateOwnerDetails = async (user_id, data) => {
    const owner = await Owner.update({
        where: { user_id: user_id },
        data: {
            company_name: data.company_name,
            gst_number: data.gst_number,
            updated_at: new Date()
        }
    });
    return owner;
};

const getOwnerByUserId = async (user_id) => {
    const owner = await Owner.findUnique({
        where: { user_id: user_id }
    });
    return owner;
};

export { getUserById, updateUserDetails, updateOwnerDetails, getOwnerByUserId };
