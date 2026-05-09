import { SupportTicket, Provider} from "../../../../prisma/db-models.js";
const getProviderByUserId = async (user_id) => {
    console.log(user_id);
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getAllSupportTicketFranchise = async (franchise_id,provider_id) => {
    const supportTicket = await SupportTicket.findMany({
        where: {    
            franchise_id: franchise_id,
            provider_id: provider_id
        }
    });
    return supportTicket;
}


export { getProviderByUserId, getAllSupportTicketFranchise };