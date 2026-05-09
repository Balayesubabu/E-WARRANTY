
import { parseDate } from "../../../../services/parse-date.js";
import { Provider ,  PurchaseInvoice } from "../../../../prisma/db-models.js";
import { logger } from "../../../../services/logger.js";


const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
};


const getPurchaseInvoices = async (provider_id,franchise_id,provider_customer_id, invoice_payment_status, start_date, end_date) => {
    let startDateFilter = new Date(start_date);
    let endDateFilter = new Date(end_date);

    const purchaseInvoices = await PurchaseInvoice.findMany({
        where: {
          provider_id: provider_id,
          franchise_id: franchise_id,
          invoice_type: "Purchase",
          created_at: {
            gte: startDateFilter,
            lte: endDateFilter,
          },
          provider_customer_id: provider_customer_id,
          invoice_payment_status: invoice_payment_status
        },
        select: {
            invoice_number: true,
            invoice_date: true,
            invoice_total_amount: true,
            invoice_payment_status: true,
            invoice_total_amount: true,
            invoice_paid_amount: true,
            invoice_pending_amount: true,
            due_date: true,
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    const formattedInvoices = purchaseInvoices.map((inv, index) => ({
    Sr_No: index + 1,
    ...inv,
    invoice_date: inv.invoice_date
        ? inv.invoice_date.toISOString().split('T')[0]
        : null,
    due_date: inv.due_date
        ? inv.due_date.toISOString().split('T')[0]
        : null,
    }));
    return formattedInvoices;
}

export { getProviderByUserId, getPurchaseInvoices };