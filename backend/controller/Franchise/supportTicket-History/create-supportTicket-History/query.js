import { SupportTicket, Provider,SupportTicketHistory} from "../../../../prisma/db-models.js";
const getProviderByUserId = async (user_id) => {
    console.log(user_id);
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const createSupportTicketHistoryFranchise = async (supportTicket_id,message,provider_id,franchise_id,staff_id) => {
    const supportTicketHistory = await SupportTicketHistory.create({
        data: {
            supportTicket_id:supportTicket_id,
            message:message,
            provider_id:provider_id,
            franchise_id:franchise_id,
            staff_id:staff_id,
            created_at: new Date()
        }
    });
    return supportTicketHistory;
} 

const getSupportTicketFranchise = async (support_ticket_id,franchise_id,provider_id) => {
    const supportTicket = await SupportTicket.findFirst({
        where: {    
            id: support_ticket_id,
            franchise_id: franchise_id,
            provider_id: provider_id
        }
    });
    return supportTicket;
}


export { getProviderByUserId, createSupportTicketHistoryFranchise,getSupportTicketFranchise };