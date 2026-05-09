import { WarrantyClaim, WarrantyClaimHistory, Provider, Franchise, ProviderWarrantyCustomer, ProviderDealer } from "../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  return Provider.findFirst({ where: { user_id } });
};

/**
 * Get warranty customer with warranty code for claim validation.
 * Returns null if not found or doesn't belong to provider.
 */
const getWarrantyCustomerForClaim = async (warranty_customer_id, provider_id) => {
  return ProviderWarrantyCustomer.findFirst({
    where: { id: warranty_customer_id, provider_id },
    include: { provider_warranty_code: true },
  });
};

/**
 * Get warranty customer by id only (for secure provider resolution).
 * Used when provider_id must be derived from the record, not from request body.
 */
const getWarrantyCustomerById = async (warranty_customer_id) => {
  return ProviderWarrantyCustomer.findUnique({
    where: { id: warranty_customer_id },
    include: { provider_warranty_code: true },
  });
};

/** Get the first franchise for a provider (used for customer claims) */
const getFirstFranchiseByProviderId = async (provider_id) => {
  return Franchise.findFirst({
    where: { provider_id },
    orderBy: { created_at: "asc" },
  });
};

const createClaim = async (data) => {
  return WarrantyClaim.create({ data });
};

const getClaimsByProvider = async (provider_id, franchise_id) => {
  return WarrantyClaim.findMany({
    where: { provider_id, franchise_id, is_active: true },
    include: {
      warranty_customer: true,
      warranty_code_ref: true,
      assigned_staff: true,
      claim_history: { orderBy: { created_at: "desc" }, take: 5 },
    },
    orderBy: { created_at: "desc" },
  });
};

const getClaimById = async (id) => {
  return WarrantyClaim.findUnique({
    where: { id },
    include: {
      warranty_customer: true,
      warranty_code_ref: true,
      assigned_staff: true,
      assigned_service_center: true,
      claim_history: { orderBy: { created_at: "desc" } },
    },
  });
};

const updateClaimStatus = async (id, data) => {
  return WarrantyClaim.update({ where: { id }, data });
};

const createClaimHistory = async (data) => {
  return WarrantyClaimHistory.create({ data });
};

const getClaimStats = async (provider_id, franchise_id) => {
  const [submitted, approved, assignedToServiceCenter, inProgress, repaired, replaced, closed, rejected] =
    await Promise.all([
      WarrantyClaim.count({ where: { provider_id, franchise_id, status: "Submitted", is_active: true } }),
      WarrantyClaim.count({ where: { provider_id, franchise_id, status: "Approved", is_active: true } }),
      WarrantyClaim.count({ where: { provider_id, franchise_id, status: "AssignedToServiceCenter", is_active: true } }),
      WarrantyClaim.count({ where: { provider_id, franchise_id, status: "InProgress", is_active: true } }),
      WarrantyClaim.count({ where: { provider_id, franchise_id, status: "Repaired", is_active: true } }),
      WarrantyClaim.count({ where: { provider_id, franchise_id, status: "Replaced", is_active: true } }),
      WarrantyClaim.count({ where: { provider_id, franchise_id, status: "Closed", is_active: true } }),
      WarrantyClaim.count({ where: { provider_id, franchise_id, status: "Rejected", is_active: true } }),
    ]);
  return { submitted, approved, assignedToServiceCenter, inProgress, repaired, replaced, closed, rejected, total: submitted + approved + assignedToServiceCenter + inProgress + repaired + replaced + closed + rejected };
};

const getClaimsByCustomer = async (warranty_customer_ids) => {
  return WarrantyClaim.findMany({
    where: {
      warranty_customer_id: { in: warranty_customer_ids },
      is_active: true,
    },
    include: {
      claim_history: { orderBy: { created_at: "desc" }, take: 5 },
    },
    orderBy: { created_at: "desc" },
  });
};

/** Get dealer by user_id */
const getDealerByUserId = async (user_id) => {
  return ProviderDealer.findFirst({ where: { user_id, is_active: true, is_deleted: false } });
};

/** Get claims for products assigned to a specific dealer */
const getClaimsByDealer = async (dealer_id) => {
  return WarrantyClaim.findMany({
    where: {
      warranty_code_ref: {
        assigned_dealer_id: dealer_id,
      },
      is_active: true,
    },
    include: {
      warranty_customer: true,
      warranty_code_ref: {
        select: {
          id: true,
          warranty_code: true,
          product_name: true,
          serial_no: true,
          warranty_from: true,
          warranty_to: true,
        },
      },
      claim_history: { orderBy: { created_at: "desc" }, take: 5 },
    },
    orderBy: { created_at: "desc" },
  });
};

/** Get claims assigned to a service center */
const getClaimsByServiceCenter = async (service_center_id) => {
  return WarrantyClaim.findMany({
    where: {
      assigned_service_center_id: service_center_id,
      is_active: true,
    },
    include: {
      warranty_customer: true,
      warranty_code_ref: {
        select: {
          id: true,
          warranty_code: true,
          product_name: true,
          serial_no: true,
          warranty_from: true,
          warranty_to: true,
        },
      },
      claim_history: { orderBy: { created_at: "desc" }, take: 5 },
    },
    orderBy: { created_at: "desc" },
  });
};

/** Get claim stats for service center */
const getClaimStatsByServiceCenter = async (service_center_id) => {
  const baseWhere = {
    assigned_service_center_id: service_center_id,
    is_active: true,
  };
  const [submitted, approved, assignedToServiceCenter, inProgress, repaired, replaced, closed, rejected] =
    await Promise.all([
      WarrantyClaim.count({ where: { ...baseWhere, status: "Submitted" } }),
      WarrantyClaim.count({ where: { ...baseWhere, status: "Approved" } }),
      WarrantyClaim.count({ where: { ...baseWhere, status: "AssignedToServiceCenter" } }),
      WarrantyClaim.count({ where: { ...baseWhere, status: "InProgress" } }),
      WarrantyClaim.count({ where: { ...baseWhere, status: "Repaired" } }),
      WarrantyClaim.count({ where: { ...baseWhere, status: "Replaced" } }),
      WarrantyClaim.count({ where: { ...baseWhere, status: "Closed" } }),
      WarrantyClaim.count({ where: { ...baseWhere, status: "Rejected" } }),
    ]);
  return {
    submitted,
    approved,
    assignedToServiceCenter,
    inProgress,
    repaired,
    replaced,
    closed,
    rejected,
    total: submitted + approved + assignedToServiceCenter + inProgress + repaired + replaced + closed + rejected,
  };
};

/** Get claim stats for dealer */
const getClaimStatsByDealer = async (dealer_id) => {
  const baseWhere = {
    warranty_code_ref: { assigned_dealer_id: dealer_id },
    is_active: true,
  };
  
  const [submitted, approved, inProgress, repaired, replaced, closed, rejected] =
    await Promise.all([
      WarrantyClaim.count({ where: { ...baseWhere, status: "Submitted" } }),
      WarrantyClaim.count({ where: { ...baseWhere, status: "Approved" } }),
      WarrantyClaim.count({ where: { ...baseWhere, status: "InProgress" } }),
      WarrantyClaim.count({ where: { ...baseWhere, status: "Repaired" } }),
      WarrantyClaim.count({ where: { ...baseWhere, status: "Replaced" } }),
      WarrantyClaim.count({ where: { ...baseWhere, status: "Closed" } }),
      WarrantyClaim.count({ where: { ...baseWhere, status: "Rejected" } }),
    ]);
  
  return {
    submitted,
    approved,
    inProgress,
    repaired,
    replaced,
    closed,
    rejected,
    total: submitted + approved + inProgress + repaired + replaced + closed + rejected,
  };
};

const getReportData = async (provider_id, franchise_id) => {
  const allClaims = await WarrantyClaim.findMany({
    where: { provider_id, franchise_id, is_active: true },
    select: {
      id: true,
      product_name: true,
      customer_name: true,
      issue_category: true,
      status: true,
      priority: true,
      created_at: true,
      closed_at: true,
      warranty_customer: {
        select: {
          dealership_installer_name: true,
          product_name: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const closedClaims = allClaims.filter((c) => c.closed_at && c.created_at);
  let avgResolutionDays = 0;
  if (closedClaims.length > 0) {
    const totalMs = closedClaims.reduce((sum, c) => sum + (new Date(c.closed_at) - new Date(c.created_at)), 0);
    avgResolutionDays = Math.round(totalMs / closedClaims.length / (1000 * 60 * 60 * 24));
  }

  const productCounts = {};
  allClaims.forEach((c) => {
    const name = c.product_name || "Unknown";
    if (!productCounts[name]) productCounts[name] = { name, claims: 0, categories: {} };
    productCounts[name].claims++;
    const cat = c.issue_category || "General";
    productCounts[name].categories[cat] = (productCounts[name].categories[cat] || 0) + 1;
  });
  const topProducts = Object.values(productCounts)
    .sort((a, b) => b.claims - a.claims)
    .slice(0, 10)
    .map((p) => ({ ...p, categories: Object.entries(p.categories).map(([k, v]) => ({ category: k, count: v })) }));

  const dealerCounts = {};
  allClaims.forEach((c) => {
    const dealer = c.warranty_customer?.dealership_installer_name || "Direct";
    if (!dealerCounts[dealer]) dealerCounts[dealer] = { name: dealer, claims: 0, approved: 0, rejected: 0 };
    dealerCounts[dealer].claims++;
    if (c.status === "Approved" || c.status === "Closed" || c.status === "Repaired" || c.status === "Replaced") dealerCounts[dealer].approved++;
    if (c.status === "Rejected") dealerCounts[dealer].rejected++;
  });
  const dealerPerformance = Object.values(dealerCounts).sort((a, b) => b.claims - a.claims).slice(0, 10);

  const monthlyClaims = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyClaims[key] = { month: monthNames[d.getMonth()], submitted: 0, approved: 0, rejected: 0 };
  }
  allClaims.forEach((c) => {
    if (c.created_at) {
      const d = new Date(c.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthlyClaims[key]) {
        monthlyClaims[key].submitted++;
        if (["Approved", "Closed", "Repaired", "Replaced"].includes(c.status)) monthlyClaims[key].approved++;
        if (c.status === "Rejected") monthlyClaims[key].rejected++;
      }
    }
  });

  return {
    avgResolutionDays,
    topProducts,
    dealerPerformance,
    monthlyClaimTrends: Object.values(monthlyClaims),
    totalClaims: allClaims.length,
  };
};

export {
  getProviderByUserId,
  getFirstFranchiseByProviderId,
  getWarrantyCustomerForClaim,
  getWarrantyCustomerById,
  createClaim,
  getClaimsByProvider,
  getClaimsByCustomer,
  getClaimById,
  updateClaimStatus,
  createClaimHistory,
  getClaimStats,
  getReportData,
  getDealerByUserId,
  getClaimsByDealer,
  getClaimStatsByDealer,
  getClaimsByServiceCenter,
  getClaimStatsByServiceCenter,
};
