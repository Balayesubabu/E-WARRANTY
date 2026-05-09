import { Provider, FranchiseInventory, Category} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

// const getProviderProducts = async (provider_id, category_id = null) => {
//   // Build the where clause conditionally
//   const whereClause = {
//     provider_id: provider_id,
//   };

//   // Add category_id to where clause if it exists
//   if (category_id) {
//     whereClause.category_id = category_id;
//   }

//   const products = await FranchiseInventory.findMany({
//     where: whereClause,
//     include: {
//       category: true,
//     },
//   });
  
//   return products;
// };

const getProviderProducts = async (provider_id, franchise_id, category_id, start_date, end_date) => {
  // Build the where clause conditionally
  const whereClause = {
        provider_id: provider_id,
        franchise_id: franchise_id,
        product_status: 'active'
    }
    if (category_id) {
        whereClause.category_id = category_id
    }
    
    const today = new Date()
    let startDateFilter = new Date(start_date);
    let endDateFilter = new Date(end_date);

    whereClause.created_at = {
        gte: startDateFilter,
        lte: endDateFilter
    };

  
  const products = await FranchiseInventory.findMany({
    where: whereClause,
   
  });
  for (const product of products) {
    if (!product.category_id){
      products.category = '-'
    }else{
    const category_name = await Category.findFirst({
      where: {
        id: product.category_id,
      },
    });
    product.category = category_name;
  }
}
  
  return products;
};



export { getProviderByUserId, getProviderProducts };
