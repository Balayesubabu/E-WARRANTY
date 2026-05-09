import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getDeliveryChallanById = async (delivery_challan_id) => {
    const deliveryChallan = await SalesInvoice.findFirst({
        where: {
            id: delivery_challan_id,
            invoice_type: "Delivery_Challan"
        },
        include: {
            provider: true,
            SalesPart: true,
            SalesService: true,
            SalesInvoiceParty: true,
            provider_customer: true,
            SalesInvoiceTransactions: true,
            Transaction: true,
            SalesAdditionalCharges: true,
            ProviderBank: true,
        }
    });
    return deliveryChallan;
}

export { getProviderByUserId, getDeliveryChallanById };