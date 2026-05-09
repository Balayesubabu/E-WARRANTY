import { Provider, PurchaseInvoice } from "../../../../prisma/db-models.js";

  const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getAllProviderPurchaseReturns = async (provider_id, franchise_id) => {

  const purchaseReturns = await PurchaseInvoice.findMany({
    where: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      invoice_type: "Purchase_Return",
      is_deleted: false,
    },
    include: {
      provider_customer: {
        include: {
          CustomerCategory: true,
        },
      },
      franchise: true,
      staff: true,
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
      PurchaseAdditionalCharges: true,
      provider: true,
      provider:{
        include:{user:true}
      }
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return purchaseReturns;
};
const getProviderPurchaseInvoice = async (purchase_invoice_id) => {
  const purchaseInvoice = await PurchaseInvoice.findFirst({
      where: {
          id: purchase_invoice_id
      }
  });
  return purchaseInvoice;
}

export { getProviderByUserId, getAllProviderPurchaseReturns,getProviderPurchaseInvoice};
