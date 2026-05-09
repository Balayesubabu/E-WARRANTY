import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { sendEmail } from "../../../services/email.js";
import {
  getUserById,
  getProviderById,
  getFranchiseByProviderId,
  createSupportTicket,
  getCustomerSupportTickets as getCustomerTicketsFromDb,
} from "./query.js";

/**
 * POST /customer/support-tickets
 * Middleware: verifyCustomerToken
 *
 * Creates a support ticket from a logged-in customer.
 * This ticket will appear in the owner/staff Support Tickets page.
 */
export const createCustomerSupportTicket = async (req, res) => {
  try {
    const userId = req.user_id;
    const { provider_id, category, warranty_code, product_name, message } = req.body;

    if (!provider_id) {
      return returnError(res, StatusCodes.BAD_REQUEST, "provider_id is required");
    }
    if (!message || !message.trim()) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Message is required");
    }

    const user = await getUserById(userId);
    if (!user) {
      return returnError(res, StatusCodes.NOT_FOUND, "User not found");
    }

    const provider = await getProviderById(provider_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const franchise = await getFranchiseByProviderId(provider_id);
    if (!franchise) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Provider has no franchise configured");
    }

    const customerName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Customer";
    const customerPhone = user.phone_number && !user.phone_number.startsWith("temp_") ? user.phone_number : "";
    const customerEmail = user.email || "";

    const title = category 
      ? `${category}${product_name ? ` - ${product_name}` : ""}`
      : `Customer Support Request${product_name ? ` - ${product_name}` : ""}`;

    const description = [
      category ? `Category: ${category}` : null,
      product_name ? `Product: ${product_name}` : null,
      warranty_code ? `Warranty Code: ${warranty_code}` : null,
      `\n${message.trim()}`,
    ].filter(Boolean).join("\n");

    const ticket = await createSupportTicket({
      provider_id,
      franchise_id: franchise.id,
      title,
      description,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
    });

    if (!ticket) {
      return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create support request");
    }

    const ownerEmail = provider.user?.email;
    if (ownerEmail) {
      sendEmail(
        ownerEmail,
        `Customer Support Request – ${category || "General"}`,
        `Customer: ${customerName}\nPhone: ${customerPhone}\nEmail: ${customerEmail}\n\n${description}`
      ).catch((err) => logger.error(`Failed to send support email: ${err.message}`));
    }

    return returnResponse(res, StatusCodes.OK, "Support request submitted", {
      id: ticket.id,
      created_at: ticket.created_at,
    });
  } catch (error) {
    logger.error("createCustomerSupportTicket error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to submit support request");
  }
};

/**
 * GET /customer/my-support-tickets
 * Middleware: verifyCustomerToken
 *
 * Returns all SupportTicket entries that match the logged-in
 * customer's email or phone number.
 */
export const getCustomerSupportTickets = async (req, res) => {
  try {
    const userId = req.user_id;

    const user = await getUserById(userId);
    if (!user) {
      return returnError(res, StatusCodes.NOT_FOUND, "User not found");
    }

    const realPhone = user.phone_number && !user.phone_number.startsWith("temp_") ? user.phone_number : null;
    const realEmail = user.email || null;

    const ticketsFromDb = await getCustomerTicketsFromDb(realPhone, realEmail, null);

    const tickets = ticketsFromDb.map((t) => ({
      id: t.id,
      provider_name: t.provider?.company_name || `${t.provider?.user?.first_name || ""} ${t.provider?.user?.last_name || ""}`.trim() || "Provider",
      title: t.title,
      message: t.description,
      status: t.status,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    return returnResponse(res, StatusCodes.OK, "Support tickets fetched", { tickets });
  } catch (error) {
    logger.error("getCustomerSupportTickets error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch support tickets");
  }
};
