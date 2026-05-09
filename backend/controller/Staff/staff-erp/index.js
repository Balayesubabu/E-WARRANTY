import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import {
  getProviderByUserId, getStaffDetailById, getStaffPerformanceStats,
  assignDealersToStaff, getAllDealersForProvider, getAllStaffForProvider,
} from "./query.js";
import {
  getStaffWithAssignments, getClaimsExecutiveDashboard, getClaimsManagerDashboard,
  getSupportDashboard, getFinanceDashboard, getRegionalManagerDashboard,
} from "./dashboard-query.js";

// ─── Get Staff Detail (Owner viewing a specific staff profile) ───

export const getStaffDetailEndpoint = async (req, res) => {
  try {
    const { staff_id } = req.params;
    const user_id = req.user_id;

    const provider = await getProviderByUserId(user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");

    const staff = await getStaffDetailById(staff_id);
    if (!staff || staff.provider_id !== provider.id) {
      return returnError(res, StatusCodes.NOT_FOUND, "Staff not found");
    }

    const performanceStats = await getStaffPerformanceStats(staff_id, provider.id);

    return returnResponse(res, StatusCodes.OK, "Staff detail fetched", {
      ...staff,
      password: undefined,
      otp: undefined,
      performance: performanceStats,
    });
  } catch (error) {
    logger.error("getStaffDetailEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch staff detail");
  }
};

// ─── Assign Dealers to Staff ───

export const assignDealersEndpoint = async (req, res) => {
  try {
    const { staff_id } = req.params;
    const { dealer_ids } = req.body;
    const user_id = req.user_id;

    const provider = await getProviderByUserId(user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");

    const staff = await getStaffDetailById(staff_id);
    if (!staff || staff.provider_id !== provider.id) {
      return returnError(res, StatusCodes.NOT_FOUND, "Staff not found");
    }

    const assignments = await assignDealersToStaff(staff_id, dealer_ids || []);
    return returnResponse(res, StatusCodes.OK, "Dealers assigned", assignments);
  } catch (error) {
    logger.error("assignDealersEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to assign dealers");
  }
};

// ─── Get dealers list (for assignment dropdown) ───

export const getDealersForAssignmentEndpoint = async (req, res) => {
  try {
    const user_id = req.user_id;
    const provider = await getProviderByUserId(user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");

    const dealers = await getAllDealersForProvider(provider.id);
    return returnResponse(res, StatusCodes.OK, "Dealers fetched", dealers);
  } catch (error) {
    logger.error("getDealersForAssignmentEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch dealers");
  }
};

// ─── Enhanced get-all-staff (with new fields) ───

export const getAllStaffEnhancedEndpoint = async (req, res) => {
  try {
    let user_id = req.user_id;
    const franchise_id = req.franchise_id;

    const provider = await getProviderByUserId(user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");

    const staffList = await getAllStaffForProvider(provider.id, franchise_id);
    return returnResponse(res, StatusCodes.OK, "Staff list fetched", staffList);
  } catch (error) {
    logger.error("getAllStaffEnhancedEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch staff list");
  }
};

// ─── Role-Based Staff Dashboard ───

export const staffRoleDashboardEndpoint = async (req, res) => {
  try {
    const staff_id = req.staff_id;
    const user_id = req.user_id;
    const franchise_id = req.franchise_id;
    const staffRoleType = req.staff_role_type || "Staff";

    const provider = await getProviderByUserId(user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");

    const staff = await getStaffWithAssignments(staff_id);
    if (!staff) return returnError(res, StatusCodes.NOT_FOUND, "Staff not found");

    let dashboardData = {};

    if (staffRoleType === "ClaimsManager" || staffRoleType === "Manager" || staffRoleType === "Admin") {
      dashboardData = await getClaimsManagerDashboard(provider.id, franchise_id);
      dashboardData.dashboardType = "claims_manager";
    } else if (staffRoleType === "Finance") {
      dashboardData = await getFinanceDashboard(provider.id);
      dashboardData.dashboardType = "finance";
    } else if (staffRoleType === "Support") {
      dashboardData = await getSupportDashboard(provider.id);
      dashboardData.dashboardType = "support";
    } else if (staffRoleType === "RegionalManager") {
      dashboardData = await getRegionalManagerDashboard(staff_id, provider.id);
      dashboardData.dashboardType = "regional_manager";
    } else {
      dashboardData = await getClaimsExecutiveDashboard(staff_id, provider.id, franchise_id);
      dashboardData.dashboardType = "claims_executive";
    }

    dashboardData.staff = {
      id: staff.id, name: staff.name, role_type: staff.role_type,
      department: staff.department, region: staff.region,
      employee_id: staff.employee_id,
      dealer_assignments: (staff.dealer_assignments || []).map((a) => a.dealer),
    };

    return returnResponse(res, StatusCodes.OK, "Dashboard fetched", dashboardData);
  } catch (error) {
    logger.error("staffRoleDashboardEndpoint error:", error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch dashboard");
  }
};
