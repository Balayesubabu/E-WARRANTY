import { Provider, SalesInvoice, PurchaseInvoice, User } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getAuditTrailByProviderId = async (provider_id,franchise_id, start_date, end_date) => {
    // Fetch all Sales Invoices (including Sales, Sales Return, Credit Note, etc.)
    const sales_invoices = await SalesInvoice.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            invoice_date: {
                gte: new Date(start_date),
                lte: new Date(end_date)
            },
            is_deleted: false
        },
        include: {
            staff: {
                select: {
                    name: true
                }
            },
            provider: {
                select: {
                    company_name: true
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    // Fetch all Purchase Invoices (including Purchase, Purchase Return, Debit Note, etc.)
    const purchase_invoices = await PurchaseInvoice.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            invoice_date: {
                gte: new Date(start_date),
                lte: new Date(end_date)
            },
            is_deleted: false
        },
        include: {
            staff: {
                select: {
                    name: true
                }
            },
            provider: {
                select: {
                    company_name: true
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    return { sales_invoices, purchase_invoices };
}

export { getProviderByUserId, getAuditTrailByProviderId };
