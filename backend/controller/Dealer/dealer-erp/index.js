import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import {
  getProviderByUserId, getDealerById, getDealerByLoginEmail,
  getDealerDashboardStats, createPurchaseOrder, getPurchaseOrdersByDealer,
  getPurchaseOrderById, createSalesEntry, getSalesEntriesByDealer,
  getDealerInventory, createLedgerEntry, getLedgerByDealer, getDealerLedgerSummary,
  updateDealerBusinessProfile, getDealerWarrantyCodes, getDealerWarrantyCodeStats,
  getDealerWarrantyCodesForPDF,
} from "./query.js";
import { generateWarrantyQRPDF } from "../../../services/pdf/e-warranty-qr.js";
import { ProviderWarrantySetting } from "../../../prisma/db-models.js";
import { resolveRegistrationUrl } from "../../../utils/resolveRegistrationUrl.js";

// Helper to get dealer from request (dealer login or owner login)
const resolveDealerId = async (req) => {
  if (req.type === "dealer" && req.dealer_id) return req.dealer_id;
  if (req.query?.dealer_id) return req.query.dealer_id;
  if (req.body?.dealer_id) return req.body.dealer_id;
  if (req.dealerEmail) {
    const dealer = await getDealerByLoginEmail(req.dealerEmail);
    return dealer?.id || null;
  }
  return null;
};

const resolveProviderIdFromDealer = async (dealer_id) => {
  const dealer = await getDealerById(dealer_id);
  return dealer?.provider_id || null;
};

// ─── Dashboard Stats ───

export const dealerDashboardStatsEndpoint = async (req, res) => {
  try {
    const dealer_id = await resolveDealerId(req);
    if (!dealer_id) return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
    const provider_id = await resolveProviderIdFromDealer(dealer_id);
    const stats = await getDealerDashboardStats(dealer_id, provider_id);
    return returnResponse(res, StatusCodes.OK, "Dashboard stats fetched", stats);
  } catch (error) {
    logger.error("dealerDashboardStatsEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch stats");
  }
};

// ─── Purchase Orders ───

export const createPurchaseOrderEndpoint = async (req, res) => {
  try {
    const { dealer_id, items, order_date, due_date, notes, discount_amount, tax_amount } = req.body;
    if (!dealer_id || !items || items.length === 0) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Dealer ID and items are required");
    }

    const user_id = req.user_id;
    const provider = await getProviderByUserId(user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");

    const dealer = await getDealerById(dealer_id);
    if (!dealer || dealer.provider_id !== provider.id) {
      return returnError(res, StatusCodes.FORBIDDEN, "Access denied");
    }

    const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}`;

    const order = await createPurchaseOrder({
      dealer_id, provider_id: provider.id, order_number: orderNumber,
      order_date, due_date, notes,
      total_amount: total - (discount_amount || 0) + (tax_amount || 0),
      discount_amount, tax_amount, items,
    });

    return returnResponse(res, StatusCodes.CREATED, "Purchase order created", order);
  } catch (error) {
    logger.error("createPurchaseOrderEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create purchase order");
  }
};

export const getPurchaseOrdersEndpoint = async (req, res) => {
  try {
    const dealer_id = await resolveDealerId(req);
    if (!dealer_id) return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
    const orders = await getPurchaseOrdersByDealer(dealer_id);
    return returnResponse(res, StatusCodes.OK, "Purchase orders fetched", orders);
  } catch (error) {
    logger.error("getPurchaseOrdersEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch orders");
  }
};

export const getPurchaseOrderDetailEndpoint = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await getPurchaseOrderById(order_id);
    if (!order) return returnError(res, StatusCodes.NOT_FOUND, "Order not found");
    return returnResponse(res, StatusCodes.OK, "Order detail fetched", order);
  } catch (error) {
    logger.error("getPurchaseOrderDetailEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch order");
  }
};

// ─── Sales Entry ───

export const createSalesEntryEndpoint = async (req, res) => {
  try {
    const dealer_id = await resolveDealerId(req);
    if (!dealer_id) return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
    const provider_id = await resolveProviderIdFromDealer(dealer_id);

    const { product_name, model_number, serial_number, customer_name, customer_phone,
            customer_email, invoice_number, sale_date, sale_amount, invoice_file, notes } = req.body;

    if (!product_name || !customer_name || !customer_phone) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Product name, customer name and phone are required");
    }

    const entry = await createSalesEntry({
      dealer_id, provider_id, product_name, model_number, serial_number,
      customer_name, customer_phone, customer_email, invoice_number,
      sale_date, sale_amount, invoice_file, notes,
    });

    return returnResponse(res, StatusCodes.CREATED, "Sales entry created", entry);
  } catch (error) {
    logger.error("createSalesEntryEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create sales entry");
  }
};

export const getSalesEntriesEndpoint = async (req, res) => {
  try {
    const dealer_id = await resolveDealerId(req);
    if (!dealer_id) return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
    const entries = await getSalesEntriesByDealer(dealer_id);
    return returnResponse(res, StatusCodes.OK, "Sales entries fetched", entries);
  } catch (error) {
    logger.error("getSalesEntriesEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch sales entries");
  }
};

// ─── Inventory ───

export const getDealerInventoryEndpoint = async (req, res) => {
  try {
    const dealer_id = await resolveDealerId(req);
    if (!dealer_id) return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
    const inventory = await getDealerInventory(dealer_id);
    return returnResponse(res, StatusCodes.OK, "Inventory fetched", inventory);
  } catch (error) {
    logger.error("getDealerInventoryEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch inventory");
  }
};

// ─── Ledger / Payments ───

export const createLedgerEntryEndpoint = async (req, res) => {
  try {
    const { dealer_id, purchase_order_id, transaction_type, amount, payment_mode, transaction_date, reference_number, notes } = req.body;
    if (!dealer_id || !amount) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Dealer ID and amount are required");
    }

    const user_id = req.user_id;
    const provider = await getProviderByUserId(user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");

    const entry = await createLedgerEntry({
      dealer_id, provider_id: provider.id, purchase_order_id,
      transaction_type, amount, payment_mode, transaction_date, reference_number, notes,
    });

    return returnResponse(res, StatusCodes.CREATED, "Ledger entry created", entry);
  } catch (error) {
    logger.error("createLedgerEntryEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create ledger entry");
  }
};

export const getLedgerEndpoint = async (req, res) => {
  try {
    const dealer_id = await resolveDealerId(req);
    if (!dealer_id) return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
    const entries = await getLedgerByDealer(dealer_id);
    const summary = await getDealerLedgerSummary(dealer_id);
    return returnResponse(res, StatusCodes.OK, "Ledger fetched", { entries, summary });
  } catch (error) {
    logger.error("getLedgerEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch ledger");
  }
};

// ─── Business Profile ───

export const getDealerBusinessProfileEndpoint = async (req, res) => {
  try {
    const dealer_id = await resolveDealerId(req);
    if (!dealer_id) return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
    const dealer = await getDealerById(dealer_id);
    return returnResponse(res, StatusCodes.OK, "Profile fetched", dealer);
  } catch (error) {
    logger.error("getDealerBusinessProfileEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch profile");
  }
};

export const updateDealerBusinessProfileEndpoint = async (req, res) => {
  try {
    const dealer_id = await resolveDealerId(req);
    if (!dealer_id) return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
    const updated = await updateDealerBusinessProfile(dealer_id, req.body);
    return returnResponse(res, StatusCodes.OK, "Profile updated", updated);
  } catch (error) {
    logger.error("updateDealerBusinessProfileEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update profile");
  }
};

// ─── Warranty Codes ───

export const getDealerWarrantyCodesEndpoint = async (req, res) => {
  try {
    const dealer_id = await resolveDealerId(req);
    if (!dealer_id) return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");

    const { page, limit, status, search, sort_by, sort_order } = req.query;
    
    const result = await getDealerWarrantyCodes(dealer_id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status: status || null,
      search: search || null,
      sort_by: sort_by || "created_at",
      sort_order: sort_order || "desc",
    });

    return returnResponse(res, StatusCodes.OK, "Warranty codes fetched", result);
  } catch (error) {
    logger.error("getDealerWarrantyCodesEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch warranty codes");
  }
};

export const getDealerWarrantyCodeStatsEndpoint = async (req, res) => {
  try {
    const dealer_id = await resolveDealerId(req);
    if (!dealer_id) return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");

    const stats = await getDealerWarrantyCodeStats(dealer_id);
    return returnResponse(res, StatusCodes.OK, "Warranty code stats fetched", stats);
  } catch (error) {
    logger.error("getDealerWarrantyCodeStatsEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch warranty code stats");
  }
};

export const generateDealerWarrantyQRPDFEndpoint = async (req, res) => {
  try {
    logger.info("generateDealerWarrantyQRPDFEndpoint");

    const dealer_id = await resolveDealerId(req);
    if (!dealer_id) return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");

    const dealer = await getDealerById(dealer_id);
    if (!dealer) return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");

    const { status, search, print_type } = req.body;

    const warranty_codes = await getDealerWarrantyCodesForPDF(dealer_id, {
      status: status || null,
      search: search || null,
    });

    if (!warranty_codes || warranty_codes.length === 0) {
      logger.error("No warranty codes found for dealer");
      return returnError(res, StatusCodes.NOT_FOUND, "No warranty codes found matching your filters");
    }

    logger.info(`Found ${warranty_codes.length} warranty codes for dealer PDF`);

    const warranty_codes_data = warranty_codes.map(code => ({
      provider_id: code.provider_id,
      product_name: code.product_name,
      product_id: code.product_id,
      service_id: code.service_id,
      serial_no: code.serial_no,
      warranty_id: code.warranty_code,
      warranty_from: code.warranty_from,
      warranty_to: code.warranty_to,
      warranty_days: code.warranty_days,
      custom_value1: code.custom_value1,
      custom_value2: code.custom_value2,
      warranty_period_readable: code.warranty_period_readable,
    }));

    const warrantySetting = await ProviderWarrantySetting.findFirst({
      where: { provider_id: dealer.provider_id },
      orderBy: { updated_at: 'desc' },
    });

    const registrationBaseUrl = resolveRegistrationUrl(warrantySetting?.registration_url ?? "");
    if (!registrationBaseUrl) {
      logger.error("Registration URL not configured (settings or FRONTEND_URL)");
      return returnError(res, StatusCodes.NOT_FOUND, "Registration URL not configured. Set it under System Settings or set FRONTEND_URL on the server.");
    }

    const pdfBase64 = await generateWarrantyQRPDF(
      registrationBaseUrl,
      warranty_codes_data,
      print_type || "A4"
    );

    return returnResponse(res, StatusCodes.OK, "QR PDF generated successfully", {
      data: pdfBase64,
      count: warranty_codes.length,
    });
  } catch (error) {
    logger.error("generateDealerWarrantyQRPDFEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate QR PDF");
  }
};
