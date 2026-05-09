import { Provider, ProviderCustomers, PurchaseInvoice, SalesInvoice } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  return await Provider.findFirst({
    where: { user_id },
  });
};

// 
const getProviderCustomersFlexible = async (provider_id) => {
  return await ProviderCustomers.findMany({
    where: { provider_id },
  });
};

const getLedgerStatementByDate = async (provider_customer_id, provider_id, franchise_id, startDate, endDate) => {
    // Set time to start of day for start date and end of day for end date
    const startDateTime = new Date(startDate);
    // startDateTime.setHours(0, 0, 0, 0);
    
    const endDateTime = new Date(endDate);
    // endDateTime.setHours(23, 59, 59, 999);

    const provider_customer_sales_data = await SalesInvoice.findMany({
        where: {
            provider_customer_id: provider_customer_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
            created_at: {
                gte: startDateTime,
                lte: endDateTime
            },
            invoice_type: {"notIn":["Quotation","Delivery_Challan","Proforma_Invoice"]}
        },
        include: {
           SalesInvoiceTransactions:{
            where:{
                     isActive: true,
               },
            },
           Transaction: true,
        }
    });
    
    // console.log("Sales Data:", provider_customer_sales_data);

    const provider_customer_purchase_data = await PurchaseInvoice.findMany({
        where: {
            provider_customer_id: provider_customer_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
            created_at: {
                gte: startDateTime,
                lte: endDateTime
            },
            invoice_type: {"notIn":["Purchase_Order"]}
        },
        include: {
            PurchaseInvoiceTransactions:{
                where:{
                    isActive: true,
                },
            },
            Transaction: true,
        }
    });

    // console.log("Purchase Data:", provider_customer_purchase_data);
    const provider_invoices_data = [...provider_customer_sales_data, ...provider_customer_purchase_data];     

    let ledger = [];

    for (const invoice of provider_invoices_data) {
        // console.log("Invoice Data:", invoice);
        const sales = invoice.SalesInvoiceTransactions || [];
        const purchase = invoice.PurchaseInvoiceTransactions || [];
        // if(invoice.invoice_type === "Sales" || invoice.invoice_type === "Booking"){
        //     ledger.push({
        //             date:  invoice.created_at,
        //             voucher:  invoice.invoice_type,
        //             invoice_number: invoice.invoice_number,
        //             credit:  invoice.invoice_paid_amount,
        //             debit: invoice.invoice_total_amount,
        //             tds_by_self: invoice.invoice_tds_amount,
        //             tds_by_party: 0
        //         });
        // }
        // if(invoice.invoice_type === "Purchase"){
        //     ledger.push({
        //             date: transaction.created_at,
        //             voucher: transaction.invoice_type,
        //             invoice_number: invoice.invoice_number,
        //             credit: transaction.total_amount,
        //             debit: transaction.amount,
        //             tds_by_self: 0,
        //             tds_by_party: invoice.invoice_tds_amount
        //         });
        // }
        if(sales.length > 0 || purchase.length > 0){
        for (const transaction of invoice.SalesInvoiceTransactions || invoice.PurchaseInvoiceTransactions) {
            if(transaction.invoice_type === "Sales" || transaction.invoice_type === "Booking")
            {
                ledger.push({
                    date: transaction.created_at || invoice.created_at,
                    voucher: transaction.invoice_type || invoice.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: transaction.amount ||  invoice.invoice_paid_amount,
                    debit: transaction.total_amount || invoice.invoice_total_amount,
                    tds_by_self: invoice.invoice_tds_amount,
                    tds_by_party: 0
                });
            }
            if(transaction.invoice_type === "Payment_In")
            {
                ledger.push({
                    date: transaction.created_at,
                    voucher: transaction.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: transaction.amount,
                    debit: 0,
                    tds_by_self: invoice.invoice_tds_amount,
                    tds_by_party: 0
                });
            }
            if(invoice.invoice_type === "Sales_Return")
            {
                ledger.push({
                    date: transaction.created_at,
                    voucher: transaction.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: transaction.amount,
                    debit: 0,
                    tds_by_self: invoice.invoice_tds_amount,
                    tds_by_party: 0
                });
            }
            if(transaction.invoice_type === "Credit_Note")
            {
                ledger.push({
                    date: transaction.created_at,
                    voucher: transaction.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: transaction.amount,
                    debit: 0,
                    tds_by_self: 0,
                    tds_by_party: invoice.invoice_tds_amount
                });

            }
            if(invoice.invoice_type === "Purchase")
            {
                ledger.push({
                    date: transaction.created_at,
                    voucher: transaction.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: transaction.total_amount,
                    debit: transaction.amount,
                    tds_by_self: 0,
                    tds_by_party: invoice.invoice_tds_amount
                });

            }
            if(invoice.invoice_type === "Purchase_Return")
            {
                ledger.push({
                    date: transaction.created_at,
                    voucher: transaction.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: 0,
                    debit: transaction.amount,
                    tds_by_self: invoice.invoice_tds_amount,
                    tds_by_party: 0
                });
            }
            
            if(transaction.invoice_type === "Debit_Note")  
            {
                ledger.push({
                    date: transaction.created_at,
                    voucher: transaction.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: 0,
                    debit: transaction.amount,
                    tds_by_self: 0,
                    tds_by_party: invoice.invoice_tds_amount
                });
            }
            if(invoice.invoice_type === "Payment_Out")
            {
                ledger.push({
                    date: transaction.created_at,
                    voucher: transaction.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: 0,
                    debit: transaction.amount,
                    tds_by_self: 0,
                    tds_by_party: invoice.invoice_tds_amount
                });
            }
        }
    }
    if(sales.length === 0 || purchase.length === 0){
        if(invoice.invoice_type === "Sales" || invoice.invoice_type === "Booking")
            {
                ledger.push({
                    date: invoice.created_at,
                    voucher: invoice.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: invoice.invoice_advance_amount,
                    debit:  invoice.invoice_total_amount,
                    tds_by_self: invoice.invoice_tds_amount,
                    tds_by_party: 0
                });
            }
            if(invoice.invoice_type === "Sales_Return")
            {
                ledger.push({
                    date: invoice.created_at,
                    voucher: invoice.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: invoice.invoice_total_amount,
                    debit: 0,
                    tds_by_self: invoice.invoice_tds_amount,
                    tds_by_party: 0
                });
            }
            if(invoice.invoice_type === "Credit_Note")
            {
                ledger.push({
                    date: invoice.created_at,
                    voucher: invoice.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: invoice.invoice_total_amount,
                    debit: 0,
                    tds_by_self: invoice.invoice_tds_amount,
                    tds_by_party: 0
                });
            }
            // if(invoice.invoice_type === "Credit_Note")
            // {
            //     ledger.push({
            //         date: invoice.created_at,
            //         voucher: invoice.invoice_type,
            //         invoice_number: invoice.invoice_number,
            //         credit: 0,
            //         debit: invoice.invoice_total_amount,
            //         tds_by_self: 0,
            //         tds_by_party: invoice.invoice_tds_amount
            //     });

            // }
            if(invoice.invoice_type === "Purchase")
            {
                ledger.push({
                    date: invoice.created_at,
                    voucher: invoice.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: invoice.invoice_total_amount,
                    debit: invoice.invoice_advance_amount,
                    tds_by_self: 0,
                    tds_by_party: invoice.invoice_tds_amount
                });

            }
            if(invoice.invoice_type === "Purchase_Return")
            {
                ledger.push({
                    date: invoice.created_at,
                    voucher: invoice.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: 0,
                    debit: invoice.invoice_total_amount,
                    tds_by_self: invoice.invoice_tds_amount,
                    tds_by_party: 0
                });
            }
            
            if(invoice.invoice_type === "Debit_Note")  
            {
                ledger.push({
                    date: invoice.created_at,
                    voucher: invoice.invoice_type,
                    invoice_number: invoice.invoice_number,
                    credit: 0,
                    debit: invoice.invoice_total_amount,
                    tds_by_self: 0,
                    tds_by_party: invoice.invoice_tds_amount
                });
            }
        }
    }
    const seen = new Set();

    const uniqueLedger = ledger.filter(item => {
    const key = `${item.voucher}_${item.invoice_number}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
    });


  return uniqueLedger;
};

export { getProviderByUserId, getProviderCustomersFlexible, getLedgerStatementByDate };
