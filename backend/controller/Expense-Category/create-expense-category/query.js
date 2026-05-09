import {Provider , ExpenseCategory} from "../../../prisma/db-models.js"

const getProviderByUserId = async(user_id) => {
    const provider = await Provider.findFirst({
        where : {
            user_id : user_id
        }
    })
    return provider;
}

export {getProviderByUserId};