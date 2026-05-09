import {Notification,Staff} from "../../../prisma/db-models.js";

const createSalesInvoice = async (req_type, title,description,type,sub_type,provider_id,franchise_id,created_by) => {
    let getList = [];
    if(req_type === "staff"){
        const staff = await Staff.findFirst({
            where: {
                provider_id: provider_id,
                franchise_id: franchise_id,
                staff_id: created_by
            }
        })
            getList = await Staff.findMany({
                where: {
                    provider_id: provider_id,
                    franchise_id: franchise_id
                }
            })
        for (let i = 0; i < getList.length; i++) {
            const notification = await Notification.create({
                data: {
                    title,
                    description,
                    type,
                    sub_type,
                    provider_id,
                    franchise_id,
                    staff_id: getList[i].id,
                    created_by: created_by,
                    created_at: new Date()
                }
            }); 

        }
    }
    else{
        getList = await Staff.findMany({
                where: {
                    provider_id: provider_id,
                    franchise_id: franchise_id
                }
            })
        for (let i = 0; i < getList.length; i++) {
            const notification = await Notification.create({
                data: {
                    title,
                    description,
                    type,
                    sub_type,
                    provider_id,
                    franchise_id,
                    staff_id: getList[i].id,
                    created_by: created_by,
                    created_at: new Date()
                }
            });
   
};

    }

    return getList
}

export {createSalesInvoice};