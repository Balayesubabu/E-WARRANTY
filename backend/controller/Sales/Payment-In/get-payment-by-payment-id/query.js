import { Provider, SalesInvoiceTransactions } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getPaymentById = async ( payment_id) => {
    const payment = await SalesInvoiceTransactions.findFirst({
        where: {
            id: payment_id,
            isActive: true
        }
    })
     return payment
   
}
export { getProviderByUserId,getPaymentById};
