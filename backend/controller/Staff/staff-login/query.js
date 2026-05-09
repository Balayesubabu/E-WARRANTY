import { Staff, Franchise} from "../../../prisma/db-models.js";

const getStaffByEmailOrPhone = async (email, phone) => {
    const conditions = [];
    if (email) conditions.push({ email: { equals: email, mode: "insensitive" } });
    if (phone) conditions.push({ phone: { equals: phone, mode: "insensitive" } });
    if (conditions.length === 0) return null;

    const staff = await Staff.findFirst({
        where: {
            OR: conditions
        },
        include: {
            provider: {
                include: {
                    user: true
                }
            }
        }
    })
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

export { getStaffByEmailOrPhone, getFranchiseById};