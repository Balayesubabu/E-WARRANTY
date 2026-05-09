import { Staff,Franchise} from "../../../prisma/db-models.js";
const getStaffByEmailOrPhoneNumber = async (phone) => {
    const staff = await Staff.findFirst({
        where: {
           phone: phone
        }
    });
    return staff;
}

const getFranchiseById = async (franchise_id) => {
    const franchise = await Franchise.findUnique({
        where: {
            id: franchise_id
        }
    });
    return franchise;
}

export { getStaffByEmailOrPhoneNumber,getFranchiseById };