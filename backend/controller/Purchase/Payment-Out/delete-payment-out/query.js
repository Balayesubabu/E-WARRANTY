import {Provider, PurchaseInvoiceTransactions,ProviderCustomers,PurchaseInvoice} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    return await Provider.findUnique({
        where: { user_id },
    });
};

const getPaymentOutById = async (payment_out_id) => {
  return await PurchaseInvoiceTransactions.findUnique({
    where: { id: payment_out_id },
    include: {
      purchase_invoice: {
        include: {
          provider_customer: true, // ✅ correct relation name
        },
      },
    },
  });
};

const deleteProviderPaymentOutById = async (payment_out_id) => {
  return await PurchaseInvoiceTransactions.update({
    where: { id: payment_out_id },
    data: { isActive: false },
  });
};

// update invoice values after deleting a payment
const updatePurchaseInvoice = async (purchase_invoice_id, data) => {
  return await PurchaseInvoice.update({
    where: { id: purchase_invoice_id },
    data : {
      invoice_pending_amount: data.invoice_pending_amount,
      invoice_paid_amount: data.invoice_paid_amount,
      is_invoice_fully_paid: data.is_invoice_fully_paid,
      invoice_payment_status: data.invoice_payment_status,
      invoice_tds_percentage: data.invoice_tds_percentage,
      invoice_tds_amount: data.invoice_tds_amount
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
    getPaymentOutById,
    deleteProviderPaymentOutById,
    updateCustomerFinalBalance,
    updatePurchaseInvoice
};