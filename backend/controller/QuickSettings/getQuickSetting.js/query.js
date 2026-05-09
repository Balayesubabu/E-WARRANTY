import { Provider, QuickSettings } from "../../../prisma/db-models.js";


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


//akash commented below
// const createQuickSettings = async (provider_id, data) => {

//   const existing = await QuickSettings.findFirst({
//     where: {
//       provider_id: provider_id,
//       prefix: data.prefix,
//       sequence_number: data.sequence_number,
//       invoice_type: data.invoice_type,
//     }
//   });

//   if (existing) {
//     throw new Error("A QuickSettings entry with the same prefix, sequence number, provider ID, and invoice type already exists.");
//   }

//   console.log(data);
//   const quickSettings = await QuickSettings.create({
//     data: {
//       provider_id: provider_id,
//       prefix: data.prefix,
//       sequence_number: data.sequence_number,
//       invoice_type: data.invoice_type,
//     }
//   });
//   console.log("quick settings",quickSettings);
//   return quickSettings;

// };



const getQuickSettings = async (provider_id,franchise_id, invoice_type) => {
  console.log(provider_id, invoice_type);

  console.log("privider id type", typeof provider_id);
  
  
   const quickSettings = await QuickSettings.findMany({
    where: {
     provider_id,
      franchise_id,
      invoice_type,
    },
    orderBy: {
      created_at: 'desc', // sort by created_at in descending order
    },
  });
  
  return quickSettings;
};  


export {
  getProviderByUserId,
  getQuickSettings
};