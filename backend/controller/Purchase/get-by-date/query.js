import {
  Provider,
  PurchaseInvoice,
  PurchasePart,
  PurchaseService,
  PurchaseInvoiceParty,
  PurchaseInvoiceTransactions,
} from "../../../prisma/db-models.js";

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

const getPurchaseInvoiceByDate = async (provider_id, franchise_id, staff_id,  start_date, end_date, invoice_type) => {
  // Normalize the range
  const start = new Date(start_date);
  start.setHours(0, 0, 0, 0); // beginning of the day

  const end = new Date(end_date);
  end.setHours(23, 59, 59, 999); // end of the day

  const purchaseInvoices = await PurchaseInvoice.findMany({
    where: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      ...(staff_id ? { staff_id: staff_id } : {}),
      is_deleted: false,
      invoice_type: invoice_type,
      invoice_date: {
        gte: start,
        lte: end,
      },
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

export { getProviderByUserId, getPurchaseInvoiceByDate };
