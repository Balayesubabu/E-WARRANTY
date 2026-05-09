import { ProviderWarrantyCustomer } from "../prisma/db-models.js";
import { logger } from "../services/logger.js";
import { sendEmail } from "../services/email.js";
import sendSMS from "../services/sms.js";

const warrantyReminder = async () => {
    try {
        logger.info(`--- Starting warranty reminder check ---`);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

        const customers = await ProviderWarrantyCustomer.findMany({
            where: {
                is_active: true,
                provider_warranty_code: {
                    warranty_check: true,
                    warranty_interval_dates: {
                        some: {
                            gte: today // Get dates that are today or in the future
                        }
                    }
                }
            },
            include: {
                provider_warranty_code: {
                    include: {
                        provider: true
                    }
                }
            }
        });

        logger.info(`Found ${customers.length} customers with upcoming warranty checks`);

        for (const customer of customers) {
            const warrantyCode = customer.provider_warranty_code;
            const reminderDays = warrantyCode.warranty_reminder_days || [0, 1, 2, 5, 10];

            // Sort dates to ensure we process them in order
            const upcomingDates = warrantyCode.warranty_interval_dates
                .filter(date => date >= today)
                .sort((a, b) => a - b);

            // Process each check date
            for (let i = 0; i < upcomingDates.length; i++) {
                const checkDate = upcomingDates[i];
                const nextCheckDate = upcomingDates[i + 1];

                // Calculate days until this check date
                const daysUntilCheck = Math.ceil((checkDate - today) / (1000 * 60 * 60 * 24));

                // Calculate gap to next check date (if exists)
                const gapToNextCheck = nextCheckDate
                    ? Math.ceil((nextCheckDate - checkDate) / (1000 * 60 * 60 * 24))
                    : Infinity;

                // Filter reminder days that are valid for this check date
                const validReminderDays = reminderDays.filter(days => {
                    return days <= daysUntilCheck && days < gapToNextCheck;
                });

                // Check if today is a valid reminder day
                if (validReminderDays.includes(daysUntilCheck)) {
                    logger.info(`Sending reminder for customer ${customer.id} for check date ${checkDate}`);

                    // Prepare message
                    // const message = `Reminder! Your appointment for ${warrantyCode.product_name} and ${warrantyCode.warranty_code} is due in ${daysUntilCheck} days on ${checkDate.toLocaleDateString()}. --${warrantyCode.provider.name}`;
                    const message = `Reminder+for+EWarranty+Maintenance&var1=${warrantyCode.provider.name}&var2=${warrantyCode.warranty_code}&var3=${daysUntilCheck}`;

                    // Send SMS
                    try {
                        await sendSMS(customer.phone, message);
                        logger.info(`SMS sent to ${customer.phone}`);
                    } catch (smsError) {
                        logger.error(`Failed to send SMS to ${customer.phone}: ${smsError}`);
                    }

                    // Send Email
                    try {
                        const emailMessage = `
                            <h4>Warranty Check Reminder</h4>
                            <p>Dear ${customer.first_name} ${customer.last_name},</p>
                            <p>This is a reminder that your warranty check for ${warrantyCode.product_name} is due in ${daysUntilCheck} days on ${checkDate.toLocaleDateString()}.</p>
                            <p>Please schedule your service visit to maintain your warranty coverage.</p>
                            <br>
                            <p>Best regards,</p>
                            <p>GVCC Solutions Pvt Ltd</p>
                        `;
                        await sendEmail(customer.email, "Warranty Check Reminder", emailMessage);
                        logger.info(`Email sent to ${customer.email}`);
                    } catch (emailError) {
                        logger.error(`Failed to send email to ${customer.email}: ${emailError}`);
                    }
                }
            }
        }

        logger.info(`--- Warranty reminder check completed ---`);
    } catch (error) {
        logger.error(`Warranty reminder error: ${error}`);
    }
};

export { warrantyReminder };