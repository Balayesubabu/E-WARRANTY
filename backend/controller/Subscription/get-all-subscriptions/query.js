import { SubscriptionPlan } from "../../../prisma/db-models.js";

const getAllSubscriptions = async () => {
    const subscriptions = await SubscriptionPlan.findMany({
        include: {
            modules: {
        include: {
          module: true, // 👈 includes the full Module record
        },
      },
        }
    });
    return subscriptions;
}

export { getAllSubscriptions };
