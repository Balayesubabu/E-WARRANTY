import {
  Provider,
  PurchaseInvoice,
  PurchasePart,
  PurchaseService,
  PurchaseInvoiceParty,
  PurchaseInvoiceTransactions,
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getPurchaseInvoiceByCustomer = async (
  provider_id,
  provider_customer_id,
  franchise_id,
  staff_id
) => {
  console.log("provider_id", provider_id);
  console.log("provider_customer_id", provider_customer_id);
  console.log("franchise_id", franchise_id);
  console.log("staff_id", staff_id);

  const purchaseInvoice = await PurchaseInvoice.findMany({
    where: {
      provider_id: provider_id,
      provider_customer_id: provider_customer_id,
      franchise_id: franchise_id,
      ...(staff_id ? { staff_id: staff_id } : {}),
      invoice_type: "Purchase"
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
    orderBy: {
      created_at: "desc",
    },
  });
  return purchaseInvoice;
};

const getInvoiceIdLinkedPurchaseInvoice = async (purchase_invoice_id) => {
  const linkedInvoices = await PurchaseInvoice.findMany({
    where: {
      link_to: purchase_invoice_id,
    },
  });
  return linkedInvoices;
};

export { getProviderByUserId, getPurchaseInvoiceByCustomer,getInvoiceIdLinkedPurchaseInvoice};
