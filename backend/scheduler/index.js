import { warrantyReminder } from "./warranty-reminder.js";
import { warrantyExpiryReminder } from "./warranty-expiry-reminder.js";
import cron from 'node-cron';
import { logger } from "../services/logger.js";

const startScheduler = async () => {
    try {
        // Schedule warranty check reminder to run at 1 AM every day
        cron.schedule('0 1 * * *', async () => {
            logger.info('Running scheduled warranty reminder check');
            await warrantyReminder();
        });

        // Schedule warranty expiry reminder to run at 2 AM every day
        cron.schedule('0 2 * * *', async () => {
            logger.info('Running scheduled warranty expiry reminder');
            await warrantyExpiryReminder();
        });

        logger.info('Scheduler started - Warranty reminders run daily at 1 AM and 2 AM');
    } catch (error) {
        logger.error(`Scheduler error: ${error}`);
    }
}

export { startScheduler };