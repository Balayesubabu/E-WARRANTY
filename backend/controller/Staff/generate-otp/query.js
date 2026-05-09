import { Staff } from "../../../prisma/db-models.js";

const getStaffByEmailOrPhoneNumber = async (phone) => {
    const staff = await Staff.findFirst({
        where: {
           phone: phone
        }
    });
    return staff;
}


export { getStaffByEmailOrPhoneNumber};