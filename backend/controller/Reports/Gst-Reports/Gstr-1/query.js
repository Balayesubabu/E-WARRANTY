import { Provider, SalesInvoice, PurchaseInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    try {
        const provider = await Provider.findFirst({
            where: {
                user_id: user_id,
                is_deleted: false
            }
        });
        return provider;
    } catch (error) {
        throw new Error(`Error fetching provider: ${error.message}`);
    }
}

const getSalesInvoiceByProviderId = async (provider_id,franchise_id, start_date, end_date) => {
    try {
        const sales_invoice = await SalesInvoice.findMany({
            where: {
                provider_id: provider_id,
                franchise_id: franchise_id,
                created_at: {
                    gte: new Date(start_date),
                    lte: new Date(end_date)
                },
                is_deleted: false,
                invoice_type: "Sales"
            },
            include: {
                provider_customer: {
                    select: {
                        customer_name: true,
                        customer_gstin_number: true,
                        customer_phone: true,
                        customer_email: true,
                        customer_state: true
                    }
                },
                 franchise : {
            select : {
                state : true
            }
        },
            },
            orderBy: {
                created_at: 'asc'
            }
        });
        return sales_invoice;
    } catch (error) {
        throw new Error(`Error fetching sales invoices: ${error.message}`);
    }
}

const getSalesReturnByProviderId = async (provider_id, franchise_id, start_date, end_date) => {
    const sales_return = await SalesInvoice.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            created_at: {
                gte: new Date(start_date),
                lte: new Date(end_date)
            },
            is_deleted: false,
            invoice_type: {
                in: ['Sales_Return', 'Credit_Note']
            }
        },
        include: {
            provider_customer: {
                select: {
                    customer_name: true,
                    customer_gstin_number: true,
                    customer_phone: true,
                    customer_email: true,
                    customer_state: true
                }
            },
              franchise : {
            select : {
                state : true
            }
        },
        
        },
        orderBy: {
            created_at: 'asc'
        }
    });
    return sales_return;
}

const getPurchaseReturnByProviderId = async (provider_id, franchise_id, start_date, end_date) => {
    const purchase_invoice = await PurchaseInvoice.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            created_at: {
                gte: new Date(start_date),
                lte: new Date(end_date)
            },
            is_deleted: false,
            invoice_type: {
                in: ['Purchase_Return', 'Debit_Note']
            }
        },
        include: {
            provider_customer: {
                select: {
                    customer_name: true,
                    customer_gstin_number: true,
                    customer_phone: true,
                    customer_email: true,
                    customer_state: true
                }
            },
            franchise : {
            select : {
                state : true
            }
        },
        },
        orderBy: {
            created_at: 'asc'
        }
    });
    return purchase_invoice;
}

export {
    getProviderByUserId,
    getSalesInvoiceByProviderId,
    getSalesReturnByProviderId,
    getPurchaseReturnByProviderId
}