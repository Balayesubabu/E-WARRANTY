import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getQuotationByDateQuery = async (start_date, end_date, provider_id) => {
    const quotations = await SalesInvoice.findMany({
        where: {
            provider_id: provider_id,
            invoice_type: "Quotation",            
              created_at: {              
                gte: new Date(start_date),
                lte: new Date(end_date),
            }
        },
        include: {
            SalesPart: true,
            SalesService: true,
            SalesInvoiceParty: true,
            provider_customer: true,
            provider: true,
            SalesInvoiceTransactions: true,
            Transaction: true,
            SalesAdditionalCharges: true
        },
    orderBy: {
      created_at: "desc",
    },
    });

    return quotations;
};

export { getProviderByUserId, getQuotationByDateQuery };