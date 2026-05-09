import { ProviderWarrantyCustomer } from "../prisma/db-models.js";
import { logger } from "../services/logger.js";
import { sendEmail } from "../services/email.js";

// Days before expiry to send reminders (e.g. 30, 14, 7, 1 days before)
const EXPIRY_REMINDER_DAYS = [30, 14, 7, 1];

/**
 * Compute warranty expiry date for a customer record.
 * Uses warranty_to from code, or date_of_installation + warranty_days, or warranty_from + warranty_days.
 */
function getExpiryDate(customer) {
  const code = customer.provider_warranty_code;
  if (!code) return null;

  if (code.warranty_to) {
    return new Date(code.warranty_to);
  }
  if (code.warranty_days) {
    const from = customer.date_of_installation
      ? new Date(customer.date_of_installation)
      : code.warranty_from
        ? new Date(code.warranty_from)
        : null;
    if (from) {
      const to = new Date(from);
      to.setDate(to.getDate() + code.warranty_days);
      return to;
    }
  }
  return null;
}

const warrantyExpiryReminder = async () => {
  try {
    logger.info(`--- Starting warranty expiry reminder check ---`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const customers = await ProviderWarrantyCustomer.findMany({
      where: {
        is_active: true,
        provider_warranty_code_id: { not: null },
        provider_warranty_code: {
          is_active: true,
          warranty_code_status: "Active",
        },
      },
      include: {
        provider_warranty_code: {
          include: {
            provider: true,
          },
        },
      },
    });

    logger.info(`Found ${customers.length} active warranty customers to check`);

    let emailsSent = 0;

    for (const customer of customers) {
      const expiryDate = getExpiryDate(customer);
      if (!expiryDate) continue;

      const expiryDateOnly = new Date(expiryDate);
      expiryDateOnly.setHours(0, 0, 0, 0);

      if (expiryDateOnly <= today) continue; // Already expired, skip

      const daysUntilExpiry = Math.ceil((expiryDateOnly - today) / (1000 * 60 * 60 * 24));

      if (!EXPIRY_REMINDER_DAYS.includes(daysUntilExpiry)) continue;

      const productName =
        customer.product_name || customer.provider_warranty_code?.product_name || "Your product";
      const providerName =
        customer.provider_warranty_code?.provider?.company_name ||
        customer.provider_warranty_code?.provider?.name ||
        "E-Warrantify";

      const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() || "Customer";

      // Send Email
      if (customer.email && customer.email.trim()) {
        try {
          const emailMessage = `
            <h4>Warranty Expiration Reminder</h4>
            <p>Dear ${customerName},</p>
            <p>This is a reminder that your warranty for <strong>${productName}</strong> will expire in <strong>${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}</strong> on ${expiryDate.toLocaleDateString()}.</p>
            <p>If you have any issues with your product, please file a claim before the warranty expires.</p>
            <br>
            <p>Best regards,</p>
            <p>${providerName}</p>
          `;
          await sendEmail(
            customer.email.trim(),
            `Warranty Expiring Soon - ${productName}`,
            emailMessage,
            { html: true }
          );
          logger.info(`Expiry reminder email sent to ${customer.email} (${productName}, ${daysUntilExpiry} days)`);
          emailsSent++;
        } catch (emailError) {
          logger.error(`Failed to send expiry reminder email to ${customer.email}: ${emailError}`);
        }
      }

      // SMS: Enable when you have an approved warranty-expiry template with your SMS provider.
      // Uncomment and configure template name to send SMS for 7-day and 1-day reminders.
      // if (daysUntilExpiry <= 7 && customer.phone?.trim()) {
      //   try {
      //     const smsMessage = `YourTemplateName&var1=${encodeURIComponent(productName)}&var2=${daysUntilExpiry}`;
      //     await sendSMS(customer.phone.trim(), smsMessage);
      //     smsSent++;
      //   } catch (e) { logger.warn(`SMS skipped: ${e?.message}`); }
      // }
    }

    logger.info(`--- Warranty expiry reminder completed: ${emailsSent} emails sent ---`);
  } catch (error) {
    logger.error(`Warranty expiry reminder error: ${error}`);
  }
};

export { warrantyExpiryReminder };
