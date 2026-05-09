import {
  Provider,
  ProviderCustomers,
  SalesInvoice,
  SalesInvoiceTransactions,
  Transaction,
  Booking
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getSalesInvoiceById = async (sales_invoice_id) => {
  const salesInvoice = await SalesInvoice.findFirst({
    where: {
      id: sales_invoice_id,
      is_invoice_fully_paid: false,
    },
    include: {
      SalesInvoiceTransactions: true,
    },
  });
  return salesInvoice;
};

const createPaymentIn = async (provider_id,staff_id,sales_invoice_id, data) => {
  const paymentIn = await SalesInvoiceTransactions.create({
    data: {
      sales_invoice_id,
      invoice_type: "Payment_In",
      amount: data.amount,
      total_amount: data.total_amount,
      pending_amount: data.pending_amount,
      paid_amount: data.paid_amount,
      transaction_type: data.transaction_type,
      transaction_status: data.transaction_status,
      transaction_id: data.transaction_id,
      payment_in_number: data.payment_in_number,
      is_apply_tds: data.is_apply_tds,
      tds_percentage: data.tds_percentage,
      tds_amount: data.tds_amount,
      notes: data.notes,
      created_by: staff_id || provider_id
    },
  });
  return paymentIn;
};

const updateSalesInvoice = async (sales_invoice_id, data) => {
  const salesInvoice = await SalesInvoice.update({
    where: {
      id: sales_invoice_id,
    },
    data: {
      invoice_pending_amount: data.invoice_pending_amount,
      invoice_paid_amount: data.invoice_paid_amount,
      is_invoice_fully_paid: data.is_invoice_fully_paid,
      invoice_payment_status: data.invoice_payment_status,
      invoice_tds_percentage: data.invoice_tds_percentage,
      invoice_tds_amount: data.invoice_tds_amount,
      total_amount_payable: data.total_amount_payable,
      payment_in_status: data.payment_in_status
    },
  });
  return salesInvoice;
};

const createTransaction = async (sales_invoice_id, data) => {
  const transaction = await Transaction.create({
    data: {
      provider_id: data.provider_id,
      provider_customer_id: data.provider_customer_id,
      sales_invoice_id: sales_invoice_id,
      invoice_type: data.invoice_type,
      amount: data.amount,
      money_in: data.money_in,
      money_out: data.money_out,
      transaction_type: data.transaction_type,
      transaction_status: data.transaction_status,
      transaction_id: data.transaction_id,
    },
  });
  return transaction;
};

const updateCustomerFinalBalance = async (provider_customer_id, data) => {
  const customerFinalBalance = await ProviderCustomers.update({
    where: {
      id: provider_customer_id,
    },
    data: {
      customer_final_balance: data.customer_final_balance,
    },
  });
  return customerFinalBalance;
};

const getAllDataSalesInvoiceById = async (sales_invoice_id) => {
  const salesInvoice = await SalesInvoice.findFirst({
    where: {
      id: sales_invoice_id,
    },
    include: {
      provider: true,
      provider:{
        include:{user:true}
      },
            
      provider_customer: true,
      franchise: true,
      SalesPart: true,
      SalesService: true,
      SalesInvoiceTransactions: true,
      SalesPackage: true,
      SalesInvoiceParty: true,
      Transaction: true,
      SalesAdditionalCharges: true,      
      // ProviderBankDetails: true,
      ProviderBank: true,
    },
  });

  return salesInvoice;
};

const getAllDataBooking = async (booking_id, provider_id, franchise_id) => {
    const booking = await Booking.findFirst({
        where: {
            id: booking_id
        },
        include: {
            BookingParts: true,
            BookingServices: true,
            customer: true,
            vehicle: true,
            provider: true,
            provider: {
                include: {
                    ProviderBankDetails: true,
                    user: true
                }
            }
        }
    });
    const salesInvoice = await SalesInvoice.findFirst({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id },
        include: {
            SalesInvoiceTransactions: true
        }
    });
    return { booking, salesInvoice };
}

const updateUrl = async (sales_invoice_id, url) => {
  const updatedInvoice = await SalesInvoice.update({
    where: {
      id: sales_invoice_id,
    },
    data: {
      invoice_pdf_url: url,
    },
  });
  return updatedInvoice;
};

const getAllDataSalesInvoiceById1 = async (sales_invoice_id,salesId) => {
  const salesInvoice = await SalesInvoice.findFirst({
    where: {
      id: sales_invoice_id,
    },
    include: {
      provider: true,
      provider:{
        include:{user:true}
      },
            
      provider_customer: true,
      franchise: true,
      SalesPart: true,
      SalesService: true,
      SalesInvoiceTransactions: true,
      SalesPackage: true,
      SalesInvoiceParty: true,
      Transaction: true,
      SalesAdditionalCharges: true,      
      // ProviderBankDetails: true,
      ProviderBank: true,
    },
  });
  const salesInvoiceReturn = await SalesInvoice.findFirst({
    where: {
      id: salesId,
    },
  });
  salesInvoice.linked_invoice_number = salesInvoiceReturn.invoice_number;
  salesInvoice.linked_invoice_type = salesInvoiceReturn.invoice_type;
  salesInvoice.linked_invoice_total_amount = salesInvoiceReturn.invoice_total_amount;
  salesInvoice.linked_invoice_paid_amount = salesInvoiceReturn.invoice_paid_amount;
  salesInvoice.linked_invoice_pending_amount = salesInvoiceReturn.invoice_pending_amount;
  return salesInvoice;
};

const updateUrl1 = async (sales_invoice_id, url,updated_payment_status) => {
  const updatedInvoice = await SalesInvoice.update({
    where: {
      id: sales_invoice_id,
    },
    data: {
      invoice_pdf_url: url,
      invoice_payment_status: updated_payment_status,
    },
  });
  return updatedInvoice;
};

export {
  getProviderByUserId,
  getSalesInvoiceById,
  createPaymentIn,
  updateSalesInvoice,
  createTransaction,
  updateCustomerFinalBalance,
  getAllDataSalesInvoiceById,
  updateUrl,
  getAllDataSalesInvoiceById1,
  updateUrl1,
  getAllDataBooking
};
