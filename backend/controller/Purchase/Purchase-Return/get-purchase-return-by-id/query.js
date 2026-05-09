import { PurchaseInvoice, Provider } from "../../../../prisma/db-models.js";

 const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getPurchaseReturnById = async (purchase_invoice_id, provider_id, franchise_id) => {
  const purchaseReturn = await PurchaseInvoice.findFirst({
    where: {
      id: purchase_invoice_id,
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
  });

  return purchaseReturn;
};
const getInvoiceIdLinkedPurchaseInvoice = async (purchase_invoice_id) => {
  const linkedInvoices = await PurchaseInvoice.findFirst({
    where: {
      link_to: purchase_invoice_id,
    },
  });
  return linkedInvoices;
};

export { getPurchaseReturnById, getProviderByUserId,getInvoiceIdLinkedPurchaseInvoice };
