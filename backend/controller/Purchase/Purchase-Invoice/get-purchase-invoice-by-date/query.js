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
      is_deleted: false,
    },
    include: {
      user: true,
    },
  });
  return provider;
};

const getPurchaseInvoiceByDate = async (provider_id, franchise_id, start_date, end_date) => {
  // Normalize the range
  const start = new Date(start_date);
  const end = new Date(end_date);

  const purchaseInvoices = await PurchaseInvoice.findMany({
    where: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      is_deleted: false,
      invoice_date: {
        gte: start,
        lte: end,
      },
      invoice_type: "Purchase"
    },
    include: {
      PurchasePart: {
        include: {
          franchise_inventory: {
            include: {
              franchise: true,
              // category: true
            },
          },
        },
      },
      PurchaseService: {
        include: {
          franchise_service: {
            include: {
              franchise: true,
            },
          },
        },
      },
      PurchaseInvoiceParty: true,
      PurchaseInvoiceTransactions: true,
      provider_customer: {
        include: {
          CustomerCategory: true,
        },
      },
      franchise: true,
      staff: true,
      PurchaseAdditionalCharges: true,
      provider: true,
      provider:{
        include:{user:true}
      }
    },
    orderBy: {
      invoice_date: "desc",
    },
  });
  return purchaseInvoices;
};
const getInvoiceIdLinkedPurchaseInvoice = async (purchase_invoice_id) => {
  const linkedInvoices = await PurchaseInvoice.findFirst({
    where: {
      link_to: purchase_invoice_id,
    },
  });
  return linkedInvoices;
};

export { getProviderByUserId, getPurchaseInvoiceByDate,getInvoiceIdLinkedPurchaseInvoice};
