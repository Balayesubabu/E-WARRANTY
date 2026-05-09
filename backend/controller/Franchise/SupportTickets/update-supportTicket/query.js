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

const updateSupportTicketFranchise = async (supportTicket_id,data,staff_id,franchise_id,provider_id) => {
    const supportTicket = await SupportTicket.update({
        where: {
            id: supportTicket_id
        },
        data: {
            title: data.title,
            description:data.description,
            status:data.status,
            staff_id:staff_id,
            franchise_id:franchise_id,
            provider_id:provider_id,
            image1:data.image1, 
            image2:data.image2,
            image3:data.image3,
            image4:data.image4,
            is_active: data.is_active       }
    });
    return supportTicket;
}


const getSupportTicketById = async (support_ticket_id) => {
    const supportTicket = await SupportTicket.findUnique({
      where: { id: support_ticket_id }
    });
    return supportTicket;
  }

export { getProviderByUserId, updateSupportTicketFranchise,getSupportTicketById};