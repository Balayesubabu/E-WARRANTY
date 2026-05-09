import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderNotifications, markNotificationAsRead } from "./query.js";

const getContactNotificationsEndpoint = async (req, res) => {
    try {
        logger.info(`getContactNotificationsEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider by user id ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }

        const excludeOwnerOnly = req.type === 'staff' || req.type === 'dealer' || req.type === 'service_center';
        logger.info(`--- Fetching contact notifications for provider: ${provider.id} (excludeOwnerOnly: ${excludeOwnerOnly}) ---`);
        const notifications = await getProviderNotifications(provider.id, { excludeOwnerOnly });

        logger.info(`--- Found ${notifications.length} notifications ---`);
        return returnResponse(res, StatusCodes.OK, `Notifications fetched successfully`, {
            notifications: notifications
        });

    } catch (error) {
        logger.error(`getContactNotificationsEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to fetch notifications`);
    }
};

const markNotificationReadEndpoint = async (req, res) => {
    try {
        logger.info(`markNotificationReadEndpoint`);

        const user_id = req.user_id;
        const { notification_id } = req.body;

        if (!notification_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, `notification_id is required`);
        }

        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }

        const notification = await markNotificationAsRead(notification_id, provider.id);

        return returnResponse(res, StatusCodes.OK, `Notification marked as read`, notification);

    } catch (error) {
        logger.error(`markNotificationReadEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to mark notification as read`);
    }
};

export { getContactNotificationsEndpoint, markNotificationReadEndpoint };
