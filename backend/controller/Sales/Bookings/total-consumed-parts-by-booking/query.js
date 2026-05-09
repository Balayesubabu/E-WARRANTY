import {Provider,FranchiseOpenInventoryTransaction, FranchiseOpenInventory} from '../../../../prisma/db-models.js';

const getProviderByUserId = async (userId) => {
    return await Provider.findFirst({
        where: {
            user_id: userId
        }
    });
}

const getTotalConsumedPartsByBooking = async (booking_id, provider_id, franchise_id) => {
  // Step 1: Group by inventory ID and sum measurement
  const grouped = await FranchiseOpenInventoryTransaction.groupBy({
    by: ['franchise_open_inventory_id','measurement_unit'],
    where: {
      booking_id,
      provider_id,
      franchise_id,
      action: 'reduce',
    },
    _sum: {
      measurement: true,
    },
  });

  // Step 2: Fetch related inventory data and attach it to each result
  const resultsWithDetails = await Promise.all(
    grouped.map(async (item) => {
      const inventory = await FranchiseOpenInventory.findUnique({
        where: { id: item.franchise_open_inventory_id }
      });

      return {
        ...item,
        franchise_open_inventory: inventory
      };
    })
  );

  return resultsWithDetails;
};
export { getProviderByUserId, getTotalConsumedPartsByBooking };