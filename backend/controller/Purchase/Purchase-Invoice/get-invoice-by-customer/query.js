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

const getPurchaseInvoiceByCustomerId = async (customer_id,provider_id, franchise_id, staff_id) => {
  const purchaseInvoice = await PurchaseInvoice.findFirst({
    where: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      ...(staff_id ? { staff_id: staff_id } : {}),
      provider_customer_id: customer_id,
      invoice_payment_status: 'Unpaid',
      is_deleted: false,
    },
    include: {
      PurchasePart: {
        include: {
          franchise_inventory: {
            include: {
              franchise: true,
              //category: true,
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
  });
  return purchaseInvoice;
};

export { getProviderByUserId, getPurchaseInvoiceByCustomerId };
