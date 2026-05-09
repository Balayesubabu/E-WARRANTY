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

const getPurchaseInvoiceById = async (purchase_invoice_id, provider_id, franchise_id, staff_id) => {

  console.log("purchase_invoice_id", purchase_invoice_id);
  console.log("provider_id", provider_id);
  console.log("staff_id", staff_id);
  console.log("franchise_id", franchise_id);
  

  const purchaseInvoice = await PurchaseInvoice.findFirst({
    where: {
      id: purchase_invoice_id,
      is_deleted: false,
      provider_id: provider_id,
      franchise_id: franchise_id,
      invoice_type: "Purchase",
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

export { getProviderByUserId, getPurchaseInvoiceById };
