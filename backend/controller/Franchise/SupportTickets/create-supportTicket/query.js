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

const createSupportTicketFranchise = async (data,staff_id,franchise_id,provider_id) => {
    console.log(data,staff_id,franchise_id,provider_id);
    const supportTicket = await SupportTicket.create({
        data: {
            title:data.title,
            description:data.description,
            status:data.status,
            staff_id:staff_id,
            franchise_id:franchise_id,
            provider_id:provider_id,
            image1:data.image1Url,
            image2:data.image2Url,
            image3:data.image3Url,
            image4:data.image4Url
        }
    });
    return supportTicket;
}


export { getProviderByUserId, createSupportTicketFranchise };