import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getDeliveryChallanByDateQuery = async (start_date, end_date, provider_id) => {
    const delivery_challans = await SalesInvoice.findMany({
        where: {
            provider_id: provider_id,
            invoice_type: "Delivery_Challan",
            created_at: {
                gte: new Date(start_date),
                lte: new Date(end_date)
            }
        },
        include: {
            provider: true,
            SalesPart: true,
            SalesService: true,
            SalesInvoiceParty: true,
            provider_customer: true,
            SalesInvoiceTransactions: true,
            Transaction: true,
            SalesAdditionalCharges: true
        },
    orderBy: {
      created_at: "desc",
    },
    });

    return delivery_challans;
};

export { getProviderByUserId, getDeliveryChallanByDateQuery };