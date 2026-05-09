import {
  Provider,
  SalesInvoiceTransactions,
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getProviderPaymentIn = async (provider_id) => {
  const paymentIn = await SalesInvoiceTransactions.findMany({
    where: {
      isActive: true,
      sales_invoice: {
        provider_id: provider_id,
      },
    },
    include: {
      sales_invoice: {
        select: {
          invoice_number: true,
          // original_invoice_number: true,
          provider_customer: {
            select: {
              customer_name: true,
            },
          },
        },
      },
    },
  });
  return paymentIn;
};

const getProviderPaymentInById = async (provider_id, franchise_id, customer_id) => {
  const paymentIn = await SalesInvoiceTransactions.findMany({
    where: {
      isActive: true,
      sales_invoice: {
        provider_id: provider_id,
        franchise_id: franchise_id,
        provider_customer_id: customer_id,
      },
    },
    include: {
      sales_invoice: {
        select: {
          invoice_number: true,
          // original_invoice_number: true,
          provider_customer: {
            select: {
              customer_name: true,
              customer_email: true,
              customer_phone: true,
              customer_gstin_number: true,
            },
          },
        },
      },
    },
  });
  return paymentIn;
};

export { getProviderByUserId, getProviderPaymentIn, getProviderPaymentInById };
