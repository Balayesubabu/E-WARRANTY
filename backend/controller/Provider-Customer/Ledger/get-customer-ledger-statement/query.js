import {
  Provider,
  ProviderCustomers,
  PurchaseInvoice,
  SalesInvoice,
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getCustomerById = async (provider_customer_id, provider_id) => {
  const customer = await ProviderCustomers.findFirst({
    where: {
      id: provider_customer_id,
      provider_id: provider_id,
    },
  });
  return customer;
};

const getLedgerStatement = async (provider_customer_id, provider_id, franchise_id) => {
  const provider_customer_sales_data = await SalesInvoice.findMany({
    where: {
      provider_customer_id: provider_customer_id,
      provider_id: provider_id,
      franchise_id: franchise_id
    },
    include: {
      SalesInvoiceTransactions: true,
      // Transaction: true,
    },
  });

  const provider_customer_purchase_data = await PurchaseInvoice.findMany({
    where: {
      provider_customer_id: provider_customer_id,
      provider_id: provider_id,
      franchise_id: franchise_id
    },
    include: {
      PurchaseInvoiceTransactions: true,
      // Transaction: true,
    },
  });

  const provider_invoices_data = [
    ...provider_customer_sales_data,
    ...provider_customer_purchase_data,
  ];

  let ledger = [];

  for (const invoice of provider_invoices_data) {
    // Handle Sales and Booking invoices
    if (
      invoice.invoice_type === "Sales" ||
      invoice.invoice_type === "Booking"
    ) {
      ledger.push({
        date: invoice.created_at,
        voucher: invoice.invoice_type,
        invoice_number: invoice.invoice_number,
        credit: 0,
        debit: invoice.invoice_total_amount,
        tds_by_self: 0,
        tds_by_party: 0,
      });

      // Add transactions if they exist
      if (
        invoice.SalesInvoiceTransactions &&
        invoice.SalesInvoiceTransactions.length > 0
      ) {
        for (const transaction of invoice.SalesInvoiceTransactions) {
          ledger.push({
            date: transaction.created_at,
            voucher: invoice.invoice_type,
            invoice_number: invoice.invoice_number,
            credit: transaction.amount,
            debit: 0,
            tds_by_self: invoice.invoice_tds_amount,
            tds_by_party: 0,
          });
        }
      }
    }
    // Handle Purchase invoices
    else if (invoice.invoice_type === "Purchase") {
      ledger.push({
        date: invoice.created_at,
        voucher: invoice.invoice_type,
        invoice_number: invoice.invoice_number,
        credit: 0,
        debit: invoice.invoice_total_amount,
        tds_by_self: 0,
        tds_by_party: 0,
      });

      // Add transactions if they exist
      if (
        invoice.PurchaseInvoiceTransactions &&
        invoice.PurchaseInvoiceTransactions.length > 0
      ) {
        for (const transaction of invoice.PurchaseInvoiceTransactions) {
          ledger.push({
            date: transaction.created_at,
            voucher: invoice.invoice_type,
            invoice_number: invoice.invoice_number,
            credit: transaction.amount,
            debit: 0,
            tds_by_self: 0,
            tds_by_party: invoice.invoice_tds_amount,
          });
        }
      }
    }
    // Handle Debit_Note (credit note for customer)
    else if (invoice.invoice_type === "Debit_Note") {
      ledger.push({
        date: invoice.created_at,
        voucher: invoice.invoice_type,
        invoice_number: invoice.invoice_number,
        credit: invoice.invoice_total_amount,
        debit: 0,
        tds_by_self: 0,
        tds_by_party: 0,
      });

      // Add transactions if they exist
      if (
        invoice.PurchaseInvoiceTransactions &&
        invoice.PurchaseInvoiceTransactions.length > 0
      ) {
        for (const transaction of invoice.PurchaseInvoiceTransactions) {
          ledger.push({
            date: transaction.created_at,
            voucher: invoice.invoice_type,
            invoice_number: invoice.invoice_number,
            credit: 0,
            debit: transaction.amount,
            tds_by_self: invoice.invoice_tds_amount,
            tds_by_party: 0,
          });
        }
      }
    }
    // Handle Credit_Note (debit note for customer)
    else if (invoice.invoice_type === "Credit_Note") {
      ledger.push({
        date: invoice.created_at,
        voucher: invoice.invoice_type,
        invoice_number: invoice.invoice_number,
        credit: 0,
        debit: invoice.invoice_total_amount,
        tds_by_self: 0,
        tds_by_party: 0,
      });

      // Add transactions if they exist
      if (
        invoice.SalesInvoiceTransactions &&
        invoice.SalesInvoiceTransactions.length > 0
      ) {
        for (const transaction of invoice.SalesInvoiceTransactions) {
          ledger.push({
            date: transaction.created_at,
            voucher: invoice.invoice_type,
            invoice_number: invoice.invoice_number,
            credit: transaction.amount,
            debit: 0,
            tds_by_self: 0,
            tds_by_party: invoice.invoice_tds_amount,
          });
        }
      }
    }
    // Handle Purchase_Return
    else if (invoice.invoice_type === "Purchase_Return") {
      ledger.push({
        date: invoice.created_at,
        voucher: invoice.invoice_type,
        invoice_number: invoice.invoice_number,
        credit: invoice.invoice_total_amount,
        debit: 0,
        tds_by_self: 0,
        tds_by_party: 0,
      });

      // Add transactions if they exist
      if (
        invoice.PurchaseInvoiceTransactions &&
        invoice.PurchaseInvoiceTransactions.length > 0
      ) {
        for (const transaction of invoice.PurchaseInvoiceTransactions) {
          ledger.push({
            date: transaction.created_at,
            voucher: invoice.invoice_type,
            invoice_number: invoice.invoice_number,
            credit: transaction.amount,
            debit: 0,
            tds_by_self: invoice.invoice_tds_amount,
            tds_by_party: 0,
          });
        }
      }
    }
    // Handle Sales_Return
    else if (invoice.invoice_type === "Sales_Return") {
      ledger.push({
        date: invoice.created_at,
        voucher: invoice.invoice_type,
        invoice_number: invoice.invoice_number,
        credit: 0,
        debit: invoice.invoice_total_amount,
        tds_by_self: 0,
        tds_by_party: 0,
      });

      // Add transactions if they exist
      if (
        invoice.SalesInvoiceTransactions &&
        invoice.SalesInvoiceTransactions.length > 0
      ) {
        for (const transaction of invoice.SalesInvoiceTransactions) {
          ledger.push({
            date: transaction.created_at,
            voucher: invoice.invoice_type,
            invoice_number: invoice.invoice_number,
            credit: transaction.amount,
            debit: 0,
            tds_by_self: 0,
            tds_by_party: invoice.invoice_tds_amount,
          });
        }
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

export { getProviderByUserId, getCustomerById, getLedgerStatement };
