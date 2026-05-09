import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getBillWiseProfitByProviderId = async (provider_id,franchise_id, start_date, end_date, provider_customer_id) => {
    const whereClause = {
        provider_id: provider_id,
        franchise_id: franchise_id,
        provider_customer_id: provider_customer_id,
        invoice_date: {
            gte: new Date(start_date),
            lte: new Date(end_date)
        },
        is_deleted: false,
        invoice_type: "Sales"
    };

    
    const sales_invoices = await SalesInvoice.findMany({
        where: whereClause,
        include: {
            provider_customer: {
                select: {
                    customer_name: true,
                    customer_phone: true,
                    customer_email: true
                }
            },
            SalesPart: true,
            SalesPart : {
                include: {
                    franchise_inventory: {
                        select: {
                            product_purchase_price: true,
                            product_gst_percentage:true
                        }
                    },
                }
            },
            
        },
        orderBy: {
            invoice_date: 'desc'
        }
    });

    return sales_invoices;
}

export { getProviderByUserId, getBillWiseProfitByProviderId };