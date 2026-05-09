import {
  Provider,
  ProviderWarrantyCustomer,
  WarrantyClaim,
  ProviderProductWarrantyCode,
  ProviderDealer,
  DealerPurchaseOrder,
  DealerPurchaseItem,
  DealerLedger,
  DealerSalesEntry,
  FranchiseInventory,
} from "../../../prisma/db-models.js";

// ───── Helper ─────
export const getProviderByUserId = async (userId) => {
  return Provider.findFirst({ where: { user_id: userId } });
};

// ═══════════════════════════════════════════
// 1. OVERVIEW KPIs
// ═══════════════════════════════════════════
export const getOverviewKPIs = async (providerId) => {
  const now = new Date();

  const [
    activeWarranties,
    totalWarrantyCodes,
    totalClaims,
    openClaims,
    slaBreach,
    purchaseOrders,
    ledgerEntries,
    dealers,
  ] = await Promise.all([
    ProviderWarrantyCustomer.count({
      where: {
        provider_id: providerId,
        is_deleted: false,
        provider_warranty_code: { warranty_to: { gt: now } },
      },
    }),
    ProviderProductWarrantyCode.count({
      where: { provider_id: providerId, is_deleted: false },
    }),
    WarrantyClaim.count({ where: { provider_id: providerId } }),
    WarrantyClaim.count({
      where: {
        provider_id: providerId,
        status: { notIn: ["Closed", "Rejected"] },
      },
    }),
    WarrantyClaim.count({
      where: {
        provider_id: providerId,
        sla_deadline: { lt: now },
        status: { notIn: ["Closed", "Rejected"] },
      },
    }),
    DealerPurchaseOrder.findMany({
      where: { dealer: { provider_id: providerId } },
      select: { total_amount: true, paid_amount: true },
    }),
    DealerLedger.findMany({
      where: { dealer: { provider_id: providerId } },
      select: { amount: true, transaction_type: true },
    }),
    ProviderDealer.count({
      where: { provider_id: providerId, is_deleted: false, is_active: true },
    }),
  ]);

  const totalRevenue = purchaseOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0);
  const totalPaid = purchaseOrders.reduce((sum, po) => sum + (po.paid_amount || 0), 0);
  const outstandingPayments = totalRevenue - totalPaid;
  const claimsRatio = totalWarrantyCodes > 0
    ? parseFloat(((totalClaims / totalWarrantyCodes) * 100).toFixed(1))
    : 0;

  return {
    totalRevenue,
    activeWarranties,
    claimsRatio,
    openClaims,
    slaBreach,
    outstandingPayments,
    totalDealers: dealers,
    totalClaims,
  };
};

// ═══════════════════════════════════════════
// 2. PURCHASE ORDERS (Owner aggregate view)
// ═══════════════════════════════════════════
export const getAllPurchaseOrders = async (providerId, { page = 1, limit = 20, search, status }) => {
  const where = { dealer: { provider_id: providerId } };

  if (status && ["UNPAID", "PARTIAL", "PAID"].includes(status)) {
    where.payment_status = status;
  }

  if (search) {
    where.OR = [
      { order_number: { contains: search, mode: "insensitive" } },
      { dealer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    DealerPurchaseOrder.findMany({
      where,
      include: {
        dealer: { select: { id: true, name: true, city: true } },
        items: { select: { product_name: true, quantity: true, total_price: true } },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    DealerPurchaseOrder.count({ where }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      dealerName: o.dealer?.name || "N/A",
      dealerCity: o.dealer?.city || "",
      orderDate: o.order_date,
      totalAmount: o.total_amount,
      paidAmount: o.paid_amount,
      pendingAmount: o.pending_amount,
      paymentStatus: o.payment_status,
      dueDate: o.due_date,
      itemCount: o.items?.length || 0,
      items: o.items,
    })),
    pagination: { page, limit, totalCount: total, totalPages: Math.ceil(total / limit) },
  };
};

// ═══════════════════════════════════════════
// 3. INVENTORY MOVEMENT (stock across dealers)
// ═══════════════════════════════════════════
export const getInventoryMovement = async (providerId, { search }) => {
  const dealers = await ProviderDealer.findMany({
    where: { provider_id: providerId, is_deleted: false },
    select: { id: true, name: true, city: true },
  });

  const dealerIds = dealers.map((d) => d.id);
  if (dealerIds.length === 0) return [];

  const [purchaseItems, salesEntries] = await Promise.all([
    DealerPurchaseItem.findMany({
      where: { purchase_order: { dealer_id: { in: dealerIds } } },
      include: { purchase_order: { select: { dealer_id: true } } },
    }),
    DealerSalesEntry.findMany({
      where: { dealer_id: { in: dealerIds } },
      select: { dealer_id: true, product_name: true, model_number: true },
    }),
  ]);

  const dealerMap = {};
  dealers.forEach((d) => { dealerMap[d.id] = d; });

  const inventoryMap = {};
  purchaseItems.forEach((item) => {
    const dId = item.purchase_order?.dealer_id;
    const key = `${dId}_${item.product_name}`;
    if (!inventoryMap[key]) {
      inventoryMap[key] = {
        dealerId: dId,
        dealerName: dealerMap[dId]?.name || "N/A",
        dealerCity: dealerMap[dId]?.city || "",
        productName: item.product_name,
        modelNumber: item.model_number || "",
        quantitySent: 0,
        quantitySold: 0,
      };
    }
    inventoryMap[key].quantitySent += item.quantity || 0;
  });

  salesEntries.forEach((s) => {
    const key = `${s.dealer_id}_${s.product_name}`;
    if (inventoryMap[key]) {
      inventoryMap[key].quantitySold += 1;
    }
  });

  let result = Object.values(inventoryMap).map((r) => ({
    ...r,
    availableStock: r.quantitySent - r.quantitySold,
  }));

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.dealerName.toLowerCase().includes(q) ||
        r.modelNumber.toLowerCase().includes(q)
    );
  }

  return result.sort((a, b) => a.productName.localeCompare(b.productName));
};

// ═══════════════════════════════════════════
// 4. DEALER LEDGER (aggregate across dealers)
// ═══════════════════════════════════════════
export const getAggregateDealerLedger = async (providerId) => {
  const dealers = await ProviderDealer.findMany({
    where: { provider_id: providerId, is_deleted: false },
    select: { id: true, name: true, city: true, credit_limit: true },
  });

  const dealerIds = dealers.map((d) => d.id);
  if (dealerIds.length === 0) return [];

  const [orders, payments] = await Promise.all([
    DealerPurchaseOrder.groupBy({
      by: ["dealer_id"],
      where: { dealer_id: { in: dealerIds } },
      _sum: { total_amount: true, paid_amount: true },
    }),
    DealerLedger.groupBy({
      by: ["dealer_id"],
      where: { dealer_id: { in: dealerIds }, transaction_type: "PAYMENT" },
      _sum: { amount: true },
    }),
  ]);

  const orderMap = {};
  orders.forEach((o) => {
    orderMap[o.dealer_id] = {
      totalPurchase: o._sum.total_amount || 0,
      totalPaid: o._sum.paid_amount || 0,
    };
  });

  const paymentMap = {};
  payments.forEach((p) => {
    paymentMap[p.dealer_id] = p._sum.amount || 0;
  });

  return dealers.map((d) => {
    const totalPurchase = orderMap[d.id]?.totalPurchase || 0;
    const totalPaid = paymentMap[d.id] || orderMap[d.id]?.totalPaid || 0;
    const outstanding = totalPurchase - totalPaid;
    const creditLimit = d.credit_limit || 0;
    let creditStatus = "Normal";
    if (creditLimit > 0 && outstanding >= creditLimit) creditStatus = "Hold";

    return {
      dealerId: d.id,
      dealerName: d.name,
      city: d.city || "",
      totalPurchase,
      totalPaid,
      outstanding,
      creditLimit,
      creditStatus,
    };
  });
};

// ═══════════════════════════════════════════
// 5. PAYMENT RECORDS (all payments across dealers)
// ═══════════════════════════════════════════
export const getPaymentRecords = async (providerId, { page = 1, limit = 20, search, dealerId }) => {
  const where = { dealer: { provider_id: providerId }, transaction_type: "PAYMENT" };

  if (dealerId) where.dealer_id = dealerId;
  if (search) {
    where.OR = [
      { reference_number: { contains: search, mode: "insensitive" } },
      { dealer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    DealerLedger.findMany({
      where,
      include: { dealer: { select: { id: true, name: true } } },
      orderBy: { transaction_date: "desc" },
      skip,
      take: limit,
    }),
    DealerLedger.count({ where }),
  ]);

  return {
    payments: entries.map((e) => ({
      id: e.id,
      dealerName: e.dealer?.name || "N/A",
      amount: e.amount,
      paymentMode: e.payment_mode,
      referenceNumber: e.reference_number || "—",
      date: e.transaction_date,
      notes: e.notes,
    })),
    pagination: { page, limit, totalCount: total, totalPages: Math.ceil(total / limit) },
  };
};

// ═══════════════════════════════════════════
// 6. WARRANTY REGISTRY (all registered warranties)
// ═══════════════════════════════════════════
export const getWarrantyRegistry = async (providerId, { page = 1, limit = 20, search, dealerId, product }) => {
  const now = new Date();
  const where = { provider_id: providerId, is_deleted: false };

  if (dealerId) where.dealer_id = dealerId;
  if (search) {
    where.OR = [
      { serial_number: { contains: search, mode: "insensitive" } },
      { warranty_code: { contains: search, mode: "insensitive" } },
      { first_name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }
  if (product) {
    where.product_name = { contains: product, mode: "insensitive" };
  }

  const skip = (page - 1) * limit;
  const [customers, total] = await Promise.all([
    ProviderWarrantyCustomer.findMany({
      where,
      include: {
        dealer: { select: { id: true, name: true } },
        provider_warranty_code: {
          select: { product_name: true, warranty_from: true, warranty_to: true, warranty_code_status: true },
        },
        WarrantyClaim: { select: { id: true, status: true, created_at: true } },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    ProviderWarrantyCustomer.count({ where }),
  ]);

  const items = customers.map((c) => {
    const wTo = c.provider_warranty_code?.warranty_to ? new Date(c.provider_warranty_code.warranty_to) : null;
    const warrantyCodeStatus = c.provider_warranty_code?.warranty_code_status;
    
    // Determine warranty status based on warranty_code_status
    let warrantyStatus = "Active";
    if (warrantyCodeStatus === "Cancelled") {
      warrantyStatus = "Cancelled";
    } else if (warrantyCodeStatus === "Pending") {
      warrantyStatus = "Pending";
    } else if (warrantyCodeStatus === "Inactive") {
      warrantyStatus = "Inactive";
    } else if (wTo && wTo < now) {
      warrantyStatus = "Expired";
    }
    
    return {
      id: c.id,
      customerName: `${c.first_name}${c.last_name ? " " + c.last_name : ""}`,
      phone: c.phone,
      email: c.email,
      serialNumber: c.serial_number || "N/A",
      productName: c.provider_warranty_code?.product_name || c.product_name || "N/A",
      warrantyCode: c.warranty_code,
      dealerName: c.dealer?.name || "Direct",
      warrantyFrom: c.provider_warranty_code?.warranty_from,
      warrantyTo: c.provider_warranty_code?.warranty_to,
      warrantyStatus,
      claimsCount: c.WarrantyClaim?.length || 0,
      registeredAt: c.created_at,
    };
  });

  return { items, pagination: { page, limit, totalCount: total, totalPages: Math.ceil(total / limit) } };
};

// ═══════════════════════════════════════════
// 7. PRODUCT MASTER
// ═══════════════════════════════════════════
export const getProductMaster = async (providerId) => {
  const codes = await ProviderProductWarrantyCode.findMany({
    where: { provider_id: providerId, is_deleted: false },
    select: {
      id: true,
      product_name: true,
      product_id: true,
      serial_no: true,
      type: true,
      warranty_days: true,
      warranty_period_readable: true,
      warranty_code_status: true,
      is_active: true,
      group_id: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
  });

  const productMap = {};
  codes.forEach((c) => {
    const key = c.product_name || c.product_id || c.id;
    if (!productMap[key]) {
      productMap[key] = {
        productName: c.product_name,
        productId: c.product_id || "",
        type: c.type,
        warrantyDuration: c.warranty_period_readable || (c.warranty_days ? `${c.warranty_days} days` : "N/A"),
        isActive: c.is_active,
        totalCodes: 0,
        activeCodes: 0,
        usedCodes: 0,
      };
    }
    productMap[key].totalCodes += 1;
    if (c.warranty_code_status === "Active") productMap[key].activeCodes += 1;
    if (c.warranty_code_status === "Active" || c.warranty_code_status === "Expired") productMap[key].usedCodes += 1;
  });

  return Object.values(productMap);
};
