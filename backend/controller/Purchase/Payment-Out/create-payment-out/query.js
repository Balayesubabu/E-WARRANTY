import { 
    Provider, 
    ProviderCustomers, 
    PurchaseInvoice, 
    PurchaseInvoiceTransactions, 
    Transaction 
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
            is_deleted: false
        }
    });
    return provider;
}

const getPurchaseInvoiceById = async (purchase_invoice_id) => {
    const purchaseInvoice = await PurchaseInvoice.findFirst({
        where: {
            id: purchase_invoice_id,
            is_deleted: false
        },
        include: {
            PurchaseInvoiceTransactions: true,
            provider_customer: {
                select: {
                    customer_final_balance: true
                }
            }
        }
    });
    return purchaseInvoice;
}

const createPaymentOut = async (purchase_invoice_id, data) => {
    const paymentOut = await PurchaseInvoiceTransactions.create({
        data: {
            purchase_invoice_id,
            invoice_type: "Payment_Out",
            amount: data.amount,
            total_amount: data.total_amount,
            pending_amount: data.pending_amount,
            paid_amount: data.paid_amount,
            transaction_type: data.transaction_type,
            transaction_status: data.transaction_status,
            transaction_id: data.transaction_id,
            notes: data.notes,
            payment_out_number: data.payment_out_number,
            created_at: new Date()
        }
    });
    return paymentOut;
}

const updatePurchaseInvoice = async (purchase_invoice_id, data) => {
    const purchaseInvoice = await PurchaseInvoice.update({
        where: {
            id: purchase_invoice_id
        },
        data: {
            invoice_pending_amount: data.invoice_pending_amount,
            invoice_paid_amount: data.invoice_paid_amount,
            is_invoice_fully_paid: data.is_invoice_fully_paid,
            invoice_payment_status: data.invoice_payment_status,
            invoice_tds_percentage: data.invoice_tds_percentage,
            invoice_tds_amount: data.invoice_tds_amount,
            payment_out_status: data.payment_out_status
        }
    });
    return purchaseInvoice;
}

const createTransaction = async (purchase_invoice_id, data) => {
    const transaction = await Transaction.create({
        data: {
            provider_id: data.provider_id,
            provider_customer_id: data.provider_customer_id,
            purchase_invoice_id: purchase_invoice_id,
            invoice_type: data.invoice_type,
            amount: data.amount,
            transaction_type: data.transaction_type,
            transaction_status: data.transaction_status,
            transaction_id: data.transaction_id
        }
    });
    return transaction;
}

const updateCustomerFinalBalance = async (provider_customer_id, data) => {
    const customerFinalBalance = await ProviderCustomers.update({
        where: {
            id: provider_customer_id
        },
        data: {
            customer_final_balance: data.customer_final_balance
        }
    });
    return customerFinalBalance;
};

const getAllDataPurchaseInvoiceById = async (purchase_invoice_id) => {
  const purchaseInvoice = await PurchaseInvoice.findFirst({
    where: {
      id: purchase_invoice_id
    },
    include: {
      provider: true,
      provider:{
        include:{user:true}
      },
      provider_customer: true,
      franchise: true,
      PurchasePart: true,
      PurchaseService: true,
      PurchaseInvoiceParty: true,
      PurchaseInvoiceTransactions: true,
      PurchasePackage: true,
      Transaction: true,
      PurchaseAdditionalCharges: true,
      ProviderBank: true,
    },
  });
  return purchaseInvoice;
};

const getAllDataPurchaseInvoiceById1 = async (purchase_invoice_id, purchaseId) => {
  const purchaseInvoice = await PurchaseInvoice.findFirst({
    where: {
      id: purchase_invoice_id
    },
    include: {
      provider: true,
      provider:{
        include:{user:true}
      },
      provider_customer: true,
      franchise: true,
      PurchasePart: true,
      PurchaseService: true,
      PurchaseInvoiceParty: true,
      PurchaseInvoiceTransactions: true,
      PurchasePackage: true,
      Transaction: true,
      PurchaseAdditionalCharges: true,
      ProviderBank: true,
    },
  });
  const linkedPurchaseInvoice = await PurchaseInvoice.findFirst({
    where: {
      id: purchaseId
    },
  });
  purchaseInvoice.linked_invoice_number = linkedPurchaseInvoice.invoice_number;
  purchaseInvoice.linked_invoice_total_amount = linkedPurchaseInvoice.invoice_total_amount;
  purchaseInvoice.linked_invoice_type = linkedPurchaseInvoice.invoice_type;
  purchaseInvoice.linked_invoice_paid_amount = linkedPurchaseInvoice.invoice_paid_amount;
  purchaseInvoice.linked_invoice_pending_amount = linkedPurchaseInvoice.invoice_pending_amount;
  return purchaseInvoice;
};

const updateUrl = async (purchase_invoice_id, url) => {
  const updatedInvoice = await PurchaseInvoice.update({
    where: {
      id: purchase_invoice_id,
    },
    data: {
      invoice_pdf_url: url,
    },
  });
  return updatedInvoice;
};

const updateUrlWithStatus = async (purchase_invoice_id, url,updated_payment_status) => {
  const updatedInvoice = await PurchaseInvoice.update({
    where: {
      id: purchase_invoice_id,
    },
    data: {
      invoice_pdf_url: url,
      invoice_payment_status: updated_payment_status
    },
  });
  return updatedInvoice;
};

export { 
    getProviderByUserId, 
    getPurchaseInvoiceById, 
    createPaymentOut, 
    updatePurchaseInvoice, 
    createTransaction, 
    updateCustomerFinalBalance,
    getAllDataPurchaseInvoiceById,
    updateUrl,
    updateUrlWithStatus,
    getAllDataPurchaseInvoiceById1 
};