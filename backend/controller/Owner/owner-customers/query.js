import {
  Provider,
  ProviderWarrantyCustomer,
  WarrantyClaim,
  ProviderProductWarrantyCode,
  ProviderDealer,
  WarrantyClaimHistory,
} from "../../../prisma/db-models.js";
import { countUniqueCustomers } from "../../../utils/uniqueCustomerCount.js";

/**
 * Get provider by user_id
 */
const getProviderByUserId = async (userId) => {
  return Provider.findFirst({ where: { user_id: userId } });
};

/**
 * Get KPI summary for owner's customer analytics
 */
const getCustomerSummary = async (providerId) => {
  const now = new Date();

  const [
    totalCustomers,
    activeWarranties,
    expiredWarranties,
    totalClaims,
    customers,
  ] = await Promise.all([
    countUniqueCustomers(providerId),
    ProviderWarrantyCustomer.count({
      where: {
        provider_id: providerId,
        is_deleted: false,
        provider_warranty_code: { warranty_to: { gt: now } },
      },
    }),
    ProviderWarrantyCustomer.count({
      where: {
        provider_id: providerId,
        is_deleted: false,
        OR: [
          { provider_warranty_code: { warranty_to: { lte: now } } },
          { provider_warranty_code: null },
        ],
      },
    }),
    WarrantyClaim.count({
      where: { provider_id: providerId },
    }),
    ProviderWarrantyCustomer.findMany({
      where: { provider_id: providerId, is_deleted: false },
      select: { city: true, state: true },
    }),
  ]);

  const claimRatio =
    totalCustomers > 0
      ? parseFloat(((totalClaims / totalCustomers) * 100).toFixed(1))
      : 0;

  const regionMap = {};
  customers.forEach((c) => {
    const region = c.state || c.city || "Unknown";
    regionMap[region] = (regionMap[region] || 0) + 1;
  });
  const regionDistribution = Object.entries(regionMap)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalCustomers,
    activeWarranties,
    expiredWarranties,
    totalClaims,
    claimRatio,
    regionDistribution,
  };
};

/**
 * Get paginated customer list with search and filters
 */
const getCustomerList = async (
  providerId,
  { page = 1, limit = 20, search, dealerId, region, claimStatus, sortBy = "created_at", sortOrder = "desc" }
) => {
  const where = { provider_id: providerId, is_deleted: false };

  if (search) {
    where.OR = [
      { first_name: { contains: search, mode: "insensitive" } },
      { last_name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { serial_number: { contains: search, mode: "insensitive" } },
      { warranty_code: { contains: search, mode: "insensitive" } },
    ];
  }

  if (dealerId) {
    where.dealer_id = dealerId;
  }

  if (region) {
    where.OR = where.OR || [];
    const regionFilter = [
      { state: { contains: region, mode: "insensitive" } },
      { city: { contains: region, mode: "insensitive" } },
    ];
    if (where.OR.length > 0) {
      where.AND = [{ OR: where.OR }, { OR: regionFilter }];
      delete where.OR;
    } else {
      where.OR = regionFilter;
    }
  }

  if (claimStatus) {
    where.WarrantyClaim = { some: { status: claimStatus } };
  }

  const allowedSorts = ["created_at", "first_name", "updated_at"];
  const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : "created_at";
  const safeSortOrder = sortOrder === "asc" ? "asc" : "desc";

  const skip = (page - 1) * limit;

  const [customers, totalCount] = await Promise.all([
    ProviderWarrantyCustomer.findMany({
      where,
      include: {
        dealer: { select: { id: true, name: true, city: true } },
        provider_warranty_code: {
          select: {
            product_name: true,
            warranty_from: true,
            warranty_to: true,
            warranty_code: true,
            warranty_code_status: true,
          },
        },
        WarrantyClaim: {
          select: { id: true, status: true },
        },
      },
      orderBy: { [safeSortBy]: safeSortOrder },
      skip,
      take: limit,
    }),
    ProviderWarrantyCustomer.count({ where }),
  ]);

  const now = new Date();
  const formattedCustomers = customers.map((c) => {
    const warrantyTo = c.provider_warranty_code?.warranty_to
      ? new Date(c.provider_warranty_code.warranty_to)
      : null;
    const warrantyCodeStatus = c.provider_warranty_code?.warranty_code_status;
    const activeClaims = c.WarrantyClaim?.filter(
      (cl) => !["Closed", "Rejected"].includes(cl.status)
    ).length || 0;

    // Determine warranty status based on warranty_code_status
    let warrantyStatus = "Active";
    if (warrantyCodeStatus === "Cancelled") {
      warrantyStatus = "Cancelled";
    } else if (warrantyCodeStatus === "Pending") {
      warrantyStatus = "Pending";
    } else if (warrantyCodeStatus === "Inactive") {
      warrantyStatus = "Inactive";
    } else if (warrantyTo && warrantyTo < now) {
      warrantyStatus = "Expired";
    }

    return {
      id: c.id,
      name: `${c.first_name}${c.last_name ? " " + c.last_name : ""}`,
      phone: c.phone,
      email: c.email,
      city: c.city,
      state: c.state,
      productName: c.provider_warranty_code?.product_name || c.product_name || "N/A",
      serialNumber: c.serial_number || "N/A",
      warrantyStatus,
      warrantyExpiry: c.provider_warranty_code?.warranty_to || null,
      totalClaims: c.WarrantyClaim?.length || 0,
      activeClaims,
      dealerName: c.dealer?.name || "Direct",
      dealerId: c.dealer?.id || null,
      lastActivity: c.updated_at,
      isActive: c.is_active,
      createdAt: c.created_at,
    };
  });

  return {
    customers: formattedCustomers,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

/**
 * Get full customer detail by ID (for owner view)
 */
const getCustomerDetail = async (providerId, customerId) => {
  const customer = await ProviderWarrantyCustomer.findFirst({
    where: { id: customerId, provider_id: providerId, is_deleted: false },
    include: {
      dealer: { select: { id: true, name: true, phone_number: true, email: true, city: true } },
      provider_warranty_code: true,
      WarrantyClaim: {
        include: {
          claim_history: { orderBy: { created_at: "desc" } },
          assigned_staff: { select: { id: true, name: true } },
        },
        orderBy: { created_at: "desc" },
      },
    },
  });

  if (!customer) return null;

  const now = new Date();
  const warrantyTo = customer.provider_warranty_code?.warranty_to
    ? new Date(customer.provider_warranty_code.warranty_to)
    : null;
  const warrantyCodeStatus = customer.provider_warranty_code?.warranty_code_status;
  
  // Determine warranty status based on warranty_code_status
  let warrantyStatus = "Active";
  if (warrantyCodeStatus === "Cancelled") {
    warrantyStatus = "Cancelled";
  } else if (warrantyCodeStatus === "Pending") {
    warrantyStatus = "Pending";
  } else if (warrantyCodeStatus === "Inactive") {
    warrantyStatus = "Inactive";
  } else if (warrantyTo && warrantyTo < now) {
    warrantyStatus = "Expired";
  }
  
  const isExpired = warrantyTo ? warrantyTo < now : true;

  // Build activity timeline
  const timeline = [];

  timeline.push({
    type: "warranty_registered",
    title: "Warranty Registered",
    description: customer.provider_warranty_code?.product_name || customer.product_name || "Product",
    date: customer.created_at,
  });

  if (warrantyTo && isExpired) {
    timeline.push({
      type: "warranty_expired",
      title: "Warranty Expired",
      description: customer.provider_warranty_code?.product_name || "Product",
      date: warrantyTo,
    });
  }

  customer.WarrantyClaim?.forEach((claim) => {
    timeline.push({
      type: "claim_raised",
      title: "Claim Raised",
      description: `${claim.product_name} — ${claim.issue_description?.substring(0, 80) || ""}`,
      date: claim.created_at,
    });

    if (claim.closed_at) {
      timeline.push({
        type: "claim_resolved",
        title: `Claim ${claim.status === "Rejected" ? "Rejected" : "Resolved"}`,
        description: claim.resolution_notes || claim.product_name,
        date: claim.closed_at,
      });
    }
  });

  timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    profile: {
      id: customer.id,
      name: `${customer.first_name}${customer.last_name ? " " + customer.last_name : ""}`,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      isActive: customer.is_active,
      internalNotes: customer.internal_notes,
      registrationDate: customer.created_at,
    },
    product: {
      productName: customer.provider_warranty_code?.product_name || customer.product_name || "N/A",
      serialNumber: customer.serial_number || "N/A",
      warrantyCode: customer.warranty_code,
      warrantyFrom: customer.provider_warranty_code?.warranty_from || null,
      warrantyTo: customer.provider_warranty_code?.warranty_to || null,
      warrantyStatus,
      invoiceNumber: customer.invoice_number,
      dateOfInstallation: customer.date_of_installation,
    },
    dealer: customer.dealer
      ? {
          id: customer.dealer.id,
          name: customer.dealer.name,
          phone: customer.dealer.phone_number,
          email: customer.dealer.email,
          city: customer.dealer.city,
        }
      : null,
    claims: (customer.WarrantyClaim || []).map((cl) => ({
      id: cl.id,
      product: cl.product_name,
      status: cl.status,
      priority: cl.priority,
      issueDescription: cl.issue_description,
      assignedStaff: cl.assigned_staff?.name || null,
      resolutionNotes: cl.resolution_notes,
      createdAt: cl.created_at,
      closedAt: cl.closed_at,
    })),
    timeline,
  };
};

/**
 * Toggle customer active/blocked status
 * Also updates the warranty code status to keep both in sync
 */
const toggleCustomerStatus = async (customerId, isActive) => {
  const customer = await ProviderWarrantyCustomer.findUnique({
    where: { id: customerId },
    select: { provider_warranty_code_id: true },
  });

  const updatedCustomer = await ProviderWarrantyCustomer.update({
    where: { id: customerId },
    data: { is_active: isActive },
  });

  if (customer?.provider_warranty_code_id) {
    await ProviderProductWarrantyCode.update({
      where: { id: customer.provider_warranty_code_id },
      data: {
        warranty_code_status: isActive ? "Active" : "Cancelled",
      },
    });
  }

  return updatedCustomer;
};

/**
 * Add or update internal notes
 */
const updateInternalNotes = async (customerId, notes) => {
  return ProviderWarrantyCustomer.update({
    where: { id: customerId },
    data: { internal_notes: notes },
  });
};

/**
 * Get dealers list for filter dropdown
 */
const getDealersForFilter = async (providerId) => {
  return ProviderDealer.findMany({
    where: { provider_id: providerId, is_deleted: false },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });
};

export {
  getProviderByUserId,
  getCustomerSummary,
  getCustomerList,
  getCustomerDetail,
  toggleCustomerStatus,
  updateInternalNotes,
  getDealersForFilter,
};
