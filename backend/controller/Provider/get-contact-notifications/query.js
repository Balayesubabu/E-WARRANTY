import { Provider, ProviderNotification } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getProviderNotifications = async (provider_id, options = {}) => {
    const { excludeOwnerOnly = false } = options;
    const where = { provider_id };
    if (excludeOwnerOnly) {
        where.owner_only = false;
    }
    const notifications = await ProviderNotification.findMany({
        where,
        orderBy: {
            created_at: 'desc'
        },
        take: 50
    });
    return notifications;
};

const markNotificationAsRead = async (notification_id, provider_id) => {
    const notification = await ProviderNotification.update({
        where: {
            id: notification_id,
            provider_id: provider_id
        },
        data: {
            is_read: true
        }
    });
    return notification;
};

export { getProviderByUserId, getProviderNotifications, markNotificationAsRead };
