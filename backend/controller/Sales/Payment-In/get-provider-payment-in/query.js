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

const getProviderPaymentIn = async (provider_id,franchise_id) => {
  const paymentIn = await SalesInvoiceTransactions.findMany({
    where: {
      isActive: true,
      invoice_type: "Payment_In",
      sales_invoice: {
        provider_id: provider_id,
        franchise_id: franchise_id


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
    orderBy: {
      created_at: "desc",
    },
  });
  return paymentIn;
};

export { getProviderByUserId, getProviderPaymentIn };
