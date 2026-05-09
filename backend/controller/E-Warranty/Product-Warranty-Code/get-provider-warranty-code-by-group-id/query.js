import { Provider, ProviderProductWarrantyCode } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getProviderWarrantyCodeByGroupId = async (provider_id) => {
    // const warranty_code = await ProviderProductWarrantyCode.findMany({
    //     where: {
    //         provider_id: provider_id
    //     },
    // });
    const warrantyCodesAll = await ProviderProductWarrantyCode.findMany({
        where: {
          provider_id: provider_id
        },
        orderBy: {
          // group_id: 'asc',
          created_at: 'desc'
        }
      });
      
      const groupedWarrantyCodes = warrantyCodesAll.reduce((acc, code) => {
        if (!acc.has(code.group_id)) {
          acc.set(code.group_id, []);
        }
        acc.get(code.group_id).push(code);
        return acc;
      }, new Map());


      const groupedWarrantyCodesArray = Array.from(groupedWarrantyCodes.entries()).map(
        ([groupId, items]) => ({
            group_id:groupId,
          itemList:items
        })
      );
 
      return groupedWarrantyCodesArray;
}

export { getProviderByUserId, getProviderWarrantyCodeByGroupId };