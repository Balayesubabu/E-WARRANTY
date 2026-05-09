import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../services/logger.js";
import { sendEmail } from "../../services/email.js";
import {
  getClaimById,
  updateClaimStatus,
  createClaimHistory,
  getClaimsByServiceCenter,
  getClaimStatsByServiceCenter,
} from "./query.js";

const VALID_STATUSES_FOR_SC = ["InProgress", "Repaired", "Replaced", "Rejected", "Closed"];
const SC_ALLOWED_TRANSITIONS = {
  AssignedToServiceCenter: ["InProgress", "Rejected"],
  InProgress: ["Repaired", "Replaced", "Rejected"],
  Repaired: ["Closed"],
  Replaced: ["Closed"],
  Rejected: [],
  Closed: [],
};

export const getServiceCenterClaimsEndpoint = async (req, res) => {
  try {
    if (req.type !== "service_center") {
      return returnError(res, StatusCodes.FORBIDDEN, "Only service centers can access this endpoint");
    }
    const service_center_id = req.service_center_id;
    if (!service_center_id) {
      return returnError(res, StatusCodes.NOT_FOUND, "Service center not found");
    }
    const claims = await getClaimsByServiceCenter(service_center_id);
    return returnResponse(res, StatusCodes.OK, "Claims fetched successfully", claims);
  } catch (error) {
    logger.error(`getServiceCenterClaimsEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const getServiceCenterClaimStatsEndpoint = async (req, res) => {
  try {
    if (req.type !== "service_center") {
      return returnError(res, StatusCodes.FORBIDDEN, "Only service centers can access this endpoint");
    }
    const service_center_id = req.service_center_id;
    if (!service_center_id) {
      return returnError(res, StatusCodes.NOT_FOUND, "Service center not found");
    }
    const stats = await getClaimStatsByServiceCenter(service_center_id);
    return returnResponse(res, StatusCodes.OK, "Claim stats fetched successfully", stats);
  } catch (error) {
    logger.error(`getServiceCenterClaimStatsEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const getServiceCenterClaimByIdEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.type !== "service_center") {
      return returnError(res, StatusCodes.FORBIDDEN, "Only service centers can access this endpoint");
    }
    const service_center_id = req.service_center_id;
    if (!service_center_id) {
      return returnError(res, StatusCodes.NOT_FOUND, "Service center not found");
    }
    const claim = await getClaimById(id);
    if (!claim) {
      return returnError(res, StatusCodes.NOT_FOUND, "Claim not found");
    }
    if (claim.assigned_service_center_id !== service_center_id) {
      return returnError(res, StatusCodes.FORBIDDEN, "You do not have access to this claim");
    }
    return returnResponse(res, StatusCodes.OK, "Claim fetched successfully", claim);
  } catch (error) {
    logger.error(`getServiceCenterClaimByIdEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const updateServiceCenterClaimStatusEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes, rejection_reason, message, internal_notes } = req.body;

    if (req.type !== "service_center") {
      return returnError(res, StatusCodes.FORBIDDEN, "Only service centers can update claim status");
    }
    const service_center_id = req.service_center_id;
    if (!service_center_id) {
      return returnError(res, StatusCodes.NOT_FOUND, "Service center not found");
    }
    if (!status || !VALID_STATUSES_FOR_SC.includes(status)) {
      return returnError(res, StatusCodes.BAD_REQUEST, `Invalid status. Must be one of: ${VALID_STATUSES_FOR_SC.join(", ")}`);
    }

    const claim = await getClaimById(id);
    if (!claim) {
      return returnError(res, StatusCodes.NOT_FOUND, "Claim not found");
    }
    if (claim.assigned_service_center_id !== service_center_id) {
      return returnError(res, StatusCodes.FORBIDDEN, "You do not have access to this claim");
    }

    const allowed = SC_ALLOWED_TRANSITIONS[claim.status] || [];
    if (!allowed.includes(status)) {
      return returnError(res, StatusCodes.BAD_REQUEST, `Cannot transition from ${claim.status} to ${status}. Allowed: ${allowed.join(", ") || "none"}`);
    }

    const updateData = { status };
    if (resolution_notes) updateData.resolution_notes = resolution_notes;
    if (rejection_reason) updateData.rejection_reason = rejection_reason;
    if (internal_notes !== undefined) updateData.internal_notes = internal_notes;
    if (status === "Closed") updateData.closed_at = new Date();

    const updated = await updateClaimStatus(id, updateData);

    await createClaimHistory({
      claim_id: id,
      previous_status: claim.status,
      new_status: status,
      message: message || `Status changed from ${claim.status} to ${status} by service center`,
      changed_by_id: null,
      changed_by_role: "service_center",
    });

    const customerEmail = claim.customer_email;
    if (customerEmail) {
      try {
        const claimRef = `WC-${id.substring(0, 8).toUpperCase()}`;
        const productName = claim.product_name || "your product";
        if (status === "Rejected") {
          const reason = rejection_reason || "Please contact support for more details.";
          await sendEmail(
            customerEmail,
            `Warranty Claim Update - ${claimRef}`,
            `Dear ${claim.customer_name || "Customer"},\n\nYour warranty claim (${claimRef}) for "${productName}" has been reviewed by our service center.\n\nUnfortunately, we are unable to approve this claim at this time.\nReason: ${reason}\n\nIf you believe this decision is incorrect, you may contact our support team.\n\nThank you,\nE-Warrantify Team`
          );
        } else if (status === "InProgress") {
          await sendEmail(
            customerEmail,
            `Warranty Claim Update - ${claimRef}`,
            `Dear ${claim.customer_name || "Customer"},\n\nYour warranty claim (${claimRef}) for "${productName}" is now IN REPAIR. Our service team is working on resolving the issue.\n\nYou can track the progress from your dashboard.\n\nThank you,\nE-Warrantify Team`
          );
        } else if (status === "Closed") {
          await sendEmail(
            customerEmail,
            `Warranty Claim Resolved - ${claimRef}`,
            `Dear ${claim.customer_name || "Customer"},\n\nYour warranty claim (${claimRef}) for "${productName}" has been resolved and closed.\n\n${resolution_notes ? `Resolution: ${resolution_notes}\n\n` : ""}Thank you for choosing our warranty program.\n\nE-Warrantify Team`
          );
        }
      } catch (emailError) {
        logger.warn(`Failed to send claim status email: ${emailError.message}`);
      }
    }

    return returnResponse(res, StatusCodes.OK, "Claim status updated successfully", updated);
  } catch (error) {
    logger.error(`updateServiceCenterClaimStatusEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};
