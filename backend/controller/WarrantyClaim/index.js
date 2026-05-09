import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../services/logger.js";
import { sendEmail } from "../../services/email.js";
import {
  getProviderByUserId,
  getFirstFranchiseByProviderId,
  getWarrantyCustomerForClaim,
  getWarrantyCustomerById,
  createClaim,
  getClaimsByProvider,
  getClaimById,
  updateClaimStatus,
  createClaimHistory,
  getClaimStats,
  getReportData,
  getClaimsByDealer,
  getClaimStatsByDealer,
} from "./query.js";

const VALID_STATUSES = ["Submitted", "Approved", "AssignedToServiceCenter", "InProgress", "Repaired", "Replaced", "Closed", "Rejected"];

const ALLOWED_TRANSITIONS = {
  Submitted: ["Approved", "Rejected", "AssignedToServiceCenter"],
  Approved: ["InProgress", "Rejected", "AssignedToServiceCenter"],
  AssignedToServiceCenter: ["InProgress", "Approved", "Rejected"],
  InProgress: ["Repaired", "Replaced", "Rejected"],
  Repaired: ["Closed"],
  Replaced: ["Closed"],
  Closed: [],
  Rejected: [],
};

const createClaimEndpoint = async (req, res) => {
  try {
    logger.info("createClaimEndpoint");
    const user_id = req.user_id;
    const franchise_id = req.franchise_id || req.headers["franchise_id"];

    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const {
      warranty_customer_id,
      warranty_code_id,
      customer_name,
      customer_email,
      customer_phone,
      product_name,
      warranty_code,
      issue_description,
      issue_category,
      priority,
    } = req.body;

    if (!warranty_customer_id || !customer_name || !customer_phone || !product_name || !issue_description) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Missing required fields: warranty_customer_id, customer_name, customer_phone, product_name, issue_description");
    }

    const warrantyCustomer = await getWarrantyCustomerForClaim(warranty_customer_id, provider.id);
    if (!warrantyCustomer) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Warranty registration not found or does not belong to this provider");
    }
    const warrantyToProvider = warrantyCustomer.provider_warranty_code?.warranty_to;
    if (warrantyToProvider && new Date(warrantyToProvider).getTime() < Date.now()) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Cannot submit claim for an expired warranty");
    }

    const claim = await createClaim({
      provider_id: provider.id,
      franchise_id: franchise_id,
      warranty_customer_id,
      warranty_code_id: warranty_code_id || null,
      customer_name,
      customer_email: customer_email || null,
      customer_phone,
      product_name,
      warranty_code: warranty_code || null,
      issue_description,
      issue_category: issue_category || null,
      priority: priority || "Medium",
      status: "Submitted",
    });

    await createClaimHistory({
      claim_id: claim.id,
      previous_status: null,
      new_status: "Submitted",
      message: "Claim submitted",
      changed_by_id: user_id,
      changed_by_role: req.type || "provider",
    });

    return returnResponse(res, StatusCodes.CREATED, "Warranty claim created successfully", claim);
  } catch (error) {
    logger.error(`createClaimEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

const getClaimsEndpoint = async (req, res) => {
  try {
    logger.info("getClaimsEndpoint");
    const user_id = req.user_id;
    const franchise_id = req.franchise_id || req.headers["franchise_id"];

    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const claims = await getClaimsByProvider(provider.id, franchise_id);
    return returnResponse(res, StatusCodes.OK, "Claims fetched successfully", claims);
  } catch (error) {
    logger.error(`getClaimsEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

const getClaimByIdEndpoint = async (req, res) => {
  try {
    logger.info("getClaimByIdEndpoint");
    const { id } = req.params;

    const claim = await getClaimById(id);
    if (!claim) {
      return returnError(res, StatusCodes.NOT_FOUND, "Claim not found");
    }

    return returnResponse(res, StatusCodes.OK, "Claim fetched successfully", claim);
  } catch (error) {
    logger.error(`getClaimByIdEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

const updateClaimStatusEndpoint = async (req, res) => {
  try {
    logger.info("updateClaimStatusEndpoint");
    const { id } = req.params;
    const { status, resolution_notes, rejection_reason, assigned_staff_id, message, internal_notes } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return returnError(res, StatusCodes.BAD_REQUEST, `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const claim = await getClaimById(id);
    if (!claim) {
      return returnError(res, StatusCodes.NOT_FOUND, "Claim not found");
    }

    const allowed = ALLOWED_TRANSITIONS[claim.status];
    if (!allowed || !allowed.includes(status)) {
      return returnError(res, StatusCodes.BAD_REQUEST, `Cannot transition from ${claim.status} to ${status}. Allowed: ${(allowed || []).join(", ") || "none"}`);
    }

    const updateData = { status };
    if (resolution_notes) updateData.resolution_notes = resolution_notes;
    if (rejection_reason) updateData.rejection_reason = rejection_reason;
    if (internal_notes !== undefined) updateData.internal_notes = internal_notes;
    if (assigned_staff_id) updateData.assigned_staff_id = assigned_staff_id;
    if (status === "AssignedToServiceCenter" && req.body.assigned_service_center_id) {
      updateData.assigned_service_center_id = req.body.assigned_service_center_id;
    }
    if (status === "Closed") updateData.closed_at = new Date();

    const updated = await updateClaimStatus(id, updateData);

    await createClaimHistory({
      claim_id: id,
      previous_status: claim.status,
      new_status: status,
      message: message || `Status changed from ${claim.status} to ${status}`,
      changed_by_id: req.user_id || req.staff_id || null,
      changed_by_role: req.type || "provider",
    });

    // Send email notification to customer on key status changes
    const customerEmail = claim.customer_email;
    if (customerEmail) {
      try {
        const productName = claim.product_name || "your product";
        const claimRef = `WC-${id.substring(0, 8).toUpperCase()}`;

        if (status === "Approved") {
          await sendEmail(
            customerEmail,
            `Warranty Claim Approved - ${claimRef}`,
            `Dear ${claim.customer_name || "Customer"},\n\nYour warranty claim (${claimRef}) for "${productName}" has been APPROVED.\n\nOur team will proceed with the resolution. You can track the progress from your dashboard.\n\nThank you,\nE-Warrantify Team`
          );
        } else if (status === "Rejected") {
          const reason = rejection_reason || "Please contact support for more details.";
          await sendEmail(
            customerEmail,
            `Warranty Claim Update - ${claimRef}`,
            `Dear ${claim.customer_name || "Customer"},\n\nYour warranty claim (${claimRef}) for "${productName}" has been reviewed.\n\nUnfortunately, we are unable to approve this claim at this time.\nReason: ${reason}\n\nIf you believe this decision is incorrect, you may contact our support team.\n\nThank you,\nE-Warrantify Team`
          );
        } else if (status === "Closed") {
          await sendEmail(
            customerEmail,
            `Warranty Claim Resolved - ${claimRef}`,
            `Dear ${claim.customer_name || "Customer"},\n\nYour warranty claim (${claimRef}) for "${productName}" has been resolved and closed.\n\n${resolution_notes ? `Resolution: ${resolution_notes}\n\n` : ""}Thank you for choosing our warranty program.\n\nE-Warrantify Team`
          );
        } else if (status === "AssignedToServiceCenter") {
          const claimWithSc = await getClaimById(id);
          const scName = claimWithSc?.assigned_service_center?.name || "our authorized service center";
          await sendEmail(
            customerEmail,
            `Warranty Claim Sent for Repair - ${claimRef}`,
            `Dear ${claim.customer_name || "Customer"},\n\nYour warranty claim (${claimRef}) for "${productName}" has been assigned to ${scName} for repair.\n\nYou can track the status of your claim from your dashboard at any time. We will update you as the repair progresses.\n\nThank you,\nE-Warrantify Team`
          );
        } else if (status === "InProgress") {
          await sendEmail(
            customerEmail,
            `Warranty Claim Update - ${claimRef}`,
            `Dear ${claim.customer_name || "Customer"},\n\nYour warranty claim (${claimRef}) for "${productName}" is now IN REPAIR. Our service team is working on resolving the issue.\n\nYou can track the progress from your dashboard.\n\nThank you,\nE-Warrantify Team`
          );
        }
      } catch (emailError) {
        logger.warn(`Failed to send claim status email to ${customerEmail}: ${emailError.message}`);
      }
    }

    return returnResponse(res, StatusCodes.OK, "Claim status updated successfully", updated);
  } catch (error) {
    logger.error(`updateClaimStatusEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

const getClaimStatsEndpoint = async (req, res) => {
  try {
    logger.info("getClaimStatsEndpoint");
    const user_id = req.user_id;
    const franchise_id = req.franchise_id || req.headers["franchise_id"];

    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const stats = await getClaimStats(provider.id, franchise_id);
    return returnResponse(res, StatusCodes.OK, "Claim stats fetched successfully", stats);
  } catch (error) {
    logger.error(`getClaimStatsEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Customer-facing claim creation endpoint.
 * Uses verifyCustomerToken - gets user_id from JWT, looks up warranties by email/phone.
 */
const customerCreateClaimEndpoint = async (req, res) => {
  try {
    logger.info("customerCreateClaimEndpoint");
    const {
      warranty_customer_id,
      warranty_code_id,
      provider_id: body_provider_id,
      customer_name,
      customer_email,
      customer_phone,
      product_name,
      warranty_code,
      issue_description,
      issue_category,
      claim_images,
    } = req.body;

    const hasContact = (customer_phone && String(customer_phone).trim()) || (customer_email && String(customer_email).trim());
    if (!warranty_customer_id || !customer_name || !hasContact || !product_name || !issue_description) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "Missing required fields. Please provide warranty, customer name, at least one contact (phone or email), product name, and issue description."
      );
    }

    if (!issue_description || issue_description.trim().length < 50) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Claim reason must be at least 50 characters");
    }

    const warrantyCustomer = await getWarrantyCustomerById(warranty_customer_id);
    if (!warrantyCustomer) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Warranty registration not found");
    }

    const provider_id = warrantyCustomer.provider_id;
    if (body_provider_id && body_provider_id !== provider_id) {
      return returnError(res, StatusCodes.FORBIDDEN, "Provider mismatch");
    }

    const franchise = await getFirstFranchiseByProviderId(provider_id);
    if (!franchise) {
      logger.error(`No franchise found for provider ${provider_id}`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "Provider has no franchise configured. Please contact support."
      );
    }

    const warrantyTo = warrantyCustomer.provider_warranty_code?.warranty_to;
    if (warrantyTo && new Date(warrantyTo).getTime() < Date.now()) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Cannot submit claim for an expired warranty");
    }

    const normalizedPhone = customer_phone && String(customer_phone).trim() ? String(customer_phone).trim() : "";
    const normalizedEmail = customer_email && String(customer_email).trim() ? String(customer_email).trim() : null;

    const claim = await createClaim({
      provider_id,
      franchise_id: franchise.id,
      warranty_customer_id,
      warranty_code_id: warranty_code_id || null,
      customer_name: String(customer_name || "").trim() || "Customer",
      customer_email: normalizedEmail,
      customer_phone: normalizedPhone || "", // Empty string when email-only (schema allows non-null empty)
      product_name,
      warranty_code: warranty_code || null,
      issue_description: issue_description.trim(),
      issue_category: issue_category || "General",
      claim_images: claim_images || [],
      priority: "Medium",
      status: "Submitted",
    });

    await createClaimHistory({
      claim_id: claim.id,
      previous_status: null,
      new_status: "Submitted",
      message: "Claim submitted by customer",
      changed_by_id: req.user_id || null,
      changed_by_role: "customer",
    });

    // Send confirmation email to customer
    if (customer_email) {
      try {
        const claimRef = `WC-${claim.id.substring(0, 8).toUpperCase()}`;
        await sendEmail(
          customer_email,
          `Warranty Claim Received - ${claimRef}`,
          `Dear ${customer_name || "Customer"},\n\nYour warranty claim (${claimRef}) for "${product_name}" has been submitted successfully.\n\nOur team will review your claim and update you on the progress. You can track the status from your dashboard.\n\nThank you,\nE-Warrantify Team`
        );
      } catch (emailError) {
        logger.warn(`Failed to send claim confirmation email: ${emailError.message}`);
      }
    }

    return returnResponse(res, StatusCodes.CREATED, "Warranty claim submitted successfully", claim);
  } catch (error) {
    logger.error(`customerCreateClaimEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to submit claim. Please try again.");
  }
};

const getReportDataEndpoint = async (req, res) => {
  try {
    logger.info("getReportDataEndpoint");
    const user_id = req.user_id;
    const franchise_id = req.franchise_id || req.headers["franchise_id"];

    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const report = await getReportData(provider.id, franchise_id);
    return returnResponse(res, StatusCodes.OK, "Report data fetched successfully", report);
  } catch (error) {
    logger.error(`getReportDataEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

/** Get warranty claims for products assigned to the logged-in dealer */
const getDealerClaimsEndpoint = async (req, res) => {
  try {
    logger.info("getDealerClaimsEndpoint");

    if (req.type !== "dealer") {
      return returnError(res, StatusCodes.FORBIDDEN, "Only dealers can access this endpoint");
    }

    const dealer_id = req.dealer_id;
    if (!dealer_id) {
      return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
    }

    const claims = await getClaimsByDealer(dealer_id);
    return returnResponse(res, StatusCodes.OK, "Claims fetched successfully", claims);
  } catch (error) {
    logger.error(`getDealerClaimsEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

/** Get warranty claim stats for the logged-in dealer */
const getDealerClaimStatsEndpoint = async (req, res) => {
  try {
    logger.info("getDealerClaimStatsEndpoint");

    if (req.type !== "dealer") {
      return returnError(res, StatusCodes.FORBIDDEN, "Only dealers can access this endpoint");
    }

    const dealer_id = req.dealer_id;
    if (!dealer_id) {
      return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
    }

    const stats = await getClaimStatsByDealer(dealer_id);
    return returnResponse(res, StatusCodes.OK, "Claim stats fetched successfully", stats);
  } catch (error) {
    logger.error(`getDealerClaimStatsEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

/** Get single claim detail for dealer (read-only) */
const getDealerClaimByIdEndpoint = async (req, res) => {
  try {
    logger.info("getDealerClaimByIdEndpoint");
    const { id } = req.params;

    if (req.type !== "dealer") {
      return returnError(res, StatusCodes.FORBIDDEN, "Only dealers can access this endpoint");
    }

    const dealer_id = req.dealer_id;
    if (!dealer_id) {
      return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
    }

    const claim = await getClaimById(id);
    if (!claim) {
      return returnError(res, StatusCodes.NOT_FOUND, "Claim not found");
    }

    // Verify the claim belongs to a product assigned to this dealer
    if (claim.warranty_code_ref?.assigned_dealer_id !== dealer_id) {
      return returnError(res, StatusCodes.FORBIDDEN, "You do not have access to this claim");
    }

    return returnResponse(res, StatusCodes.OK, "Claim fetched successfully", claim);
  } catch (error) {
    logger.error(`getDealerClaimByIdEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export {
  createClaimEndpoint,
  customerCreateClaimEndpoint,
  getClaimsEndpoint,
  getClaimByIdEndpoint,
  updateClaimStatusEndpoint,
  getClaimStatsEndpoint,
  getReportDataEndpoint,
  getDealerClaimsEndpoint,
  getDealerClaimStatsEndpoint,
  getDealerClaimByIdEndpoint,
};
