import { SupportTicket, Provider,SupportTicketHistory,Staff} from "../../../../prisma/db-models.js";
const getProviderByUserId = async (user_id) => {
    console.log(user_id);
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}


const getSupportTicketFranchise = async (support_ticket_id,franchise_id,provider_id) => {
    const supportTicket = await SupportTicket.findFirst({
        where: {    
            id: support_ticket_id,
            franchise_id: franchise_id,
            provider_id: provider_id
        }
    });
    // console.log(supportTicket);
    return supportTicket;
}

const getAllSupportTicketHistoryFranchise = async (supportTicket_id) => {
    const supportTicketHistory = await SupportTicketHistory.findMany({
        where: {        
            supportTicket_id: supportTicket_id,
        }
    });
    return supportTicketHistory;
}

const getUserByProviderId = async (provider_id) => {
    const provider = await Provider.findUnique({
        where: {
            id: provider_id
        },
        select: {
            user: true
        }
    });
    return provider.user;
}

const getStaffById = async (staff_id,franchise_id) => {
    const staff = await Staff.findFirst({
        where: {
            id: staff_id,
            franchise_id: franchise_id
        }
    });
    return staff;
}


export { getProviderByUserId, getSupportTicketFranchise, getAllSupportTicketHistoryFranchise,getUserByProviderId,getStaffById};