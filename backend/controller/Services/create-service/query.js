import { Provider, FranchiseService } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const createService = async (data, provider_id,franchise_id,staff_id) => {
    const service = await FranchiseService.create({
        data: {
            franchise_id: franchise_id,
            provider_id: provider_id,
            staff_id: staff_id || null,
            service_name: data.service_name,
            service_description: data.service_description,
            service_price: data.service_price,
            service_gst_percentage: data.service_gst_percentage,
            service_gst_amount: data.service_gst_amount,
            service_total_price: data.service_total_price,
            service_icon: data.service_icon,
            service_type: data.service_type,
            service_slug: data.service_slug,
            service_sac_code: data.service_sac_code,
            service_number: data.service_number,
            service_is_active: true,
            products_list: data.products_list || [],
            check_list: data.check_list || [],
            duration: data.duration,
            created_at: new Date(),
            created_by: staff_id || provider_id
        },
    });
    return service;
}

export { getProviderByUserId, createService };