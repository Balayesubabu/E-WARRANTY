
import { parseDate } from "../../../../services/parse-date.js";
import { Provider, FranchiseInventory, PurchaseInvoice, PurchasePart, SalesInvoice, SalesPart, Category } from "../../../../prisma/db-models.js";


const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id
    }
  })
  return provider;
};


const getProviderProducts = async (
  provider_id,
  franchise_id,
  provider_customer_id,
  start_date,
  end_date
) => {
  const startDateTime = new Date(start_date);
  const endDateTime = new Date(end_date);

  const products = await FranchiseInventory.findMany({
    where: {
      provider_id: provider_id,
    },
    include: {
      PurchasePart: {
        where: {
          purchase_invoice: {
            provider_customer_id: provider_customer_id,
            invoice_type:"Purchase",
            franchise_id: franchise_id,
            provider_id: provider_id,
            created_at: {
                gte: startDateTime,
                lte: endDateTime
            }
            
          }
        },
        include: {
              franchise_inventory: true
            }
      },

      SalesPart: {
        where: {
          sales_invoice: {
            provider_customer_id: provider_customer_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
            invoice_type:"Sales",
            created_at: {
                gte: startDateTime,
                lte: endDateTime
            }
          }
        },
        include: {
          franchise_inventory: true
        }
      },
    }
  });

  for (let product of products) {
    if(product.category_id){
    const category = await Category.findFirst({
      where: {
        id: product.category_id
      }
    });
    product.categoryName = category ? category.category_name : '';
  }
  else{
    product.categoryName = '';
  }
}
  console.log(products,"products");
  return products;
};


export { getProviderByUserId, getProviderProducts };