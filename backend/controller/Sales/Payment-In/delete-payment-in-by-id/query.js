import {
  Provider,
  ProviderCustomers,
  SalesInvoice,
  SalesInvoiceTransactions,
} from "../../../../prisma/db-models.js";

// find provider by logged-in user
const getProviderByUserId = async (user_id) => {
  return await Provider.findFirst({
    where: { user_id },
  });
};

// find a specific payment transaction by its id
const getPaymentInById = async (payment_in_id) => {
  return await SalesInvoiceTransactions.findUnique({
    where: { id: payment_in_id },
    include: {
      sales_invoice: {
        include: {
          provider_customer: true, // ✅ correct relation name
        },
      },
    },
  });
};

// delete a payment transaction by its id
const deleteProviderPaymentInById = async (payment_in_id) => {
  return await SalesInvoiceTransactions.update({
    where: { id: payment_in_id },
    data: { isActive: false },
  });
};

// update invoice values after deleting a payment
const updateSalesInvoice = async (sales_invoice_id, data) => {
  return await SalesInvoice.update({
    where: { id: sales_invoice_id },
    data : {
      invoice_pending_amount: data.invoice_pending_amount,
      invoice_paid_amount: data.invoice_paid_amount,
      is_invoice_fully_paid: data.is_invoice_fully_paid,
      invoice_payment_status: data.invoice_payment_status,
      invoice_tds_percentage: data.invoice_tds_percentage,
      invoice_tds_amount: data.invoice_tds_amount,
      total_amount_payable: data.total_amount_payable
    }
  });
};

// update customer balance after deleting a payment
const updateCustomerFinalBalance = async (provider_customer_id, data) => {
  return await ProviderCustomers.update({
    where: { id: provider_customer_id },
    data,
  });
};

export {
  getProviderByUserId,
  getPaymentInById,
  deleteProviderPaymentInById,
  updateSalesInvoice,
  updateCustomerFinalBalance,
};
