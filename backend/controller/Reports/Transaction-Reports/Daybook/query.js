import { Provider, SalesInvoice, PurchaseInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getDaybookReportByProviderId = async (provider_id, franchise_id,start_date, end_date, provider_customer_id = null, transaction_type = null) => {
    const baseWhereClause = {
        provider_id: provider_id,
        franchise_id: franchise_id,
        provider_customer_id: provider_customer_id ? provider_customer_id : undefined,
        invoice_date: {
            gte: new Date(start_date),
            lte: new Date(end_date)
        },
        is_deleted: false
    };

    const salesWhereClause = { ...baseWhereClause };
    const purchaseWhereClause = { ...baseWhereClause };

     let sales_invoices = [];
    let purchase_invoices = [];
    if(transaction_type === 'Sales' || transaction_type === 'Sales_Return' || transaction_type === 'Credit_Note' || transaction_type === 'Booking' || transaction_type === 'Quotation' || transaction_type === 'Payment_In' || transaction_type === 'Delivery_Order' || transaction_type === 'Proforma_Invoice'){
        salesWhereClause.invoice_type = transaction_type;
        sales_invoices = await SalesInvoice.findMany({
        where: salesWhereClause,
        include: {
            provider_customer: {
                select: {
                    customer_name: true,
                    customer_phone: true,
                    customer_email: true
                }
            },
            SalesInvoiceTransactions: {
                select: {
                    transaction_type: true,
                    transaction_status: true,
                    amount: true,
                    created_at: true
                }
            }
        },
        orderBy: {
            invoice_date: 'desc'
        }
    });
    }
    else if(transaction_type === 'Purchase' || transaction_type === 'Purchase_Return' || transaction_type === 'Debit_Note' || transaction_type === 'Purchase_Order'){
        purchaseWhereClause.invoice_type = transaction_type;
        purchase_invoices = await PurchaseInvoice.findMany({
        where: purchaseWhereClause,
        include: {
            provider_customer: {
                select: {
                    customer_name: true,
                    customer_phone: true,
                    customer_email: true
                }
            },
            PurchaseInvoiceTransactions: {
                select: {
                    transaction_type: true,
                    transaction_status: true,
                    amount: true,
                    created_at: true
                }
            }
        },
        orderBy: {
            invoice_date: 'desc'
        }
    });
    }
    else{
        sales_invoices = await SalesInvoice.findMany({
        where: salesWhereClause,
        include: {
            provider_customer: {
                select: {
                    customer_name: true,
                    customer_phone: true,
                    customer_email: true
                }
            },
            SalesInvoiceTransactions: {
                select: {
                    transaction_type: true,
                    transaction_status: true,
                    amount: true,
                    created_at: true
                }
            }
        },
        orderBy: {
            invoice_date: 'desc'
        }
    });
        purchase_invoices = await PurchaseInvoice.findMany({
        where: purchaseWhereClause,
        include: {
            provider_customer: {
                select: {
                    customer_name: true,
                    customer_phone: true,
                    customer_email: true
                }
            },
            PurchaseInvoiceTransactions: {
                select: {
                    transaction_type: true,
                    transaction_status: true,
                    amount: true,
                    created_at: true
                }
            }
        },
        orderBy: {
            invoice_date: 'desc'
        }
    });
    }

    return { sales_invoices, purchase_invoices };
}

export { getProviderByUserId, getDaybookReportByProviderId };
