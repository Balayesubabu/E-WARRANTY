import {Provider, SalesInvoice} from  "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id
    }
  })
  return provider;
};

const getJobCardReports = async (provider_id, franchise_id, start_date, end_date) => {
    const startDateTime = new Date(start_date);
    const endDateTime = new Date(end_date);
    console.log('Start DateTime:', startDateTime);
    console.log('End DateTime:', endDateTime);

    const jobCardReports = await SalesInvoice.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            created_at: {
                gte: startDateTime,
                lte: endDateTime
            },
            invoice_type: 'Sales',
            booking_id: {
                not: null   
            }
        },
        select:
        {
            id: true,
            invoice_number: true,
            created_at: true,
            booking_id: true,
            invoice_total_amount: true,
            invoice_pending_amount: true,
            invoice_paid_amount: true,
            invoice_total_parts_amount: true,
            invoice_total_services_amount: true,
            invoice_discount_amount: true,
            invoice_additional_discount_amount: true,
        }
    });
    console.log('Job Card Reports:', JSON.stringify(jobCardReports));
    const result = jobCardReports.map(item => ({
        ...item,
        total_discount: (item.invoice_discount_amount || 0) + (item.invoice_additional_discount_amount || 0)
    }));
    return result;
};

export { getProviderByUserId, getJobCardReports };