import {
  Staff, WarrantyClaim, StaffDealerAssignment, ProviderDealer,
  DealerLedger, DealerPurchaseOrder,
} from "../../../prisma/db-models.js";
import { prisma } from "../../../prisma/db-models.js";

// ─── Common ───

export const getStaffWithAssignments = async (staff_id) => {
  return Staff.findUnique({
    where: { id: staff_id },
    include: {
      dealer_assignments: { include: { dealer: { select: { id: true, name: true, city: true } } } },
    },
  });
};

const todayStart = () => {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
};
const weekStart = () => {
  const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return d;
};
const monthStart = () => {
  const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
};

// ─── Claims Executive Dashboard ───

export const getClaimsExecutiveDashboard = async (staff_id, provider_id, franchise_id) => {
  const now = new Date();
  const today = todayStart();
  const week = weekStart();

  const baseWhere = { assigned_staff_id: staff_id, provider_id, franchise_id };

  const [assignedToday, totalPending, overdue, resolvedWeek, allAssigned] = await Promise.all([
    WarrantyClaim.count({ where: { ...baseWhere, created_at: { gte: today } } }),
    WarrantyClaim.count({ where: { ...baseWhere, status: { in: ["Submitted", "InProgress"] } } }),
    WarrantyClaim.count({ where: { ...baseWhere, sla_deadline: { lt: now }, status: { notIn: ["Closed", "Rejected"] } } }),
    WarrantyClaim.count({ where: { ...baseWhere, status: "Closed", updated_at: { gte: week } } }),
    WarrantyClaim.findMany({
      where: { ...baseWhere, status: { notIn: ["Closed", "Rejected"] } },
      include: { warranty_customer: { select: { first_name: true, last_name: true } } },
      orderBy: [{ priority: "asc" }, { created_at: "asc" }],
      take: 50,
    }),
  ]);

  const claims = allAssigned.map((c) => ({
    id: c.id, customer_name: c.customer_name, product_name: c.product_name,
    priority: c.priority, status: c.status, sla_deadline: c.sla_deadline,
    created_at: c.created_at, issue_description: c.issue_description,
    sla_remaining: c.sla_deadline ? Math.max(0, Math.round((new Date(c.sla_deadline) - now) / 3600000)) : null,
    is_overdue: c.sla_deadline ? new Date(c.sla_deadline) < now : false,
  }));

  return {
    kpis: { assignedToday, totalPending, overdue, resolvedWeek },
    claims,
  };
};

// ─── Claims Manager Dashboard ───

export const getClaimsManagerDashboard = async (provider_id, franchise_id) => {
  const today = todayStart();

  const baseWhere = { provider_id, franchise_id };

  const [awaitingApproval, escalated, rejectedToday, allPending] = await Promise.all([
    WarrantyClaim.count({ where: { ...baseWhere, status: "Submitted" } }),
    WarrantyClaim.count({ where: { ...baseWhere, priority: "High", status: { in: ["Submitted", "InProgress"] } } }),
    WarrantyClaim.count({ where: { ...baseWhere, status: "Rejected", updated_at: { gte: today } } }),
    WarrantyClaim.findMany({
      where: { ...baseWhere, status: { in: ["Submitted", "InProgress"] } },
      include: {
        assigned_staff: { select: { id: true, name: true } },
        warranty_customer: { select: { first_name: true, last_name: true } },
      },
      orderBy: [{ priority: "asc" }, { created_at: "asc" }],
      take: 50,
    }),
  ]);

  const claims = allPending.map((c) => ({
    id: c.id, customer_name: c.customer_name, product_name: c.product_name,
    priority: c.priority, status: c.status, created_at: c.created_at,
    assigned_executive: c.assigned_staff?.name || "Unassigned",
    sla_deadline: c.sla_deadline, issue_description: c.issue_description,
  }));

  return {
    kpis: { awaitingApproval, escalated, rejectedToday },
    claims,
  };
};

// ─── Support Executive Dashboard ───

export const getSupportDashboard = async (provider_id) => {
  const today = todayStart();

  const [openTickets, resolvedToday, allTickets] = await Promise.all([
    prisma.supportTicket.count({ where: { provider_id, status: { not: "Closed" } } }).catch(() => 0),
    prisma.supportTicket.count({ where: { provider_id, status: "Closed", updated_at: { gte: today } } }).catch(() => 0),
    prisma.supportTicket.findMany({
      where: { provider_id, status: { not: "Closed" } },
      orderBy: { created_at: "desc" },
      take: 50,
    }).catch(() => []),
  ]);

  const tickets = allTickets.map((t) => ({
    id: t.id, subject: t.subject || t.title || "Support Ticket",
    status: t.status, priority: t.priority || "Medium",
    category: t.category || t.type || "General",
    created_at: t.created_at, customer_name: t.customer_name || "",
    customer_email: t.customer_email || "",
  }));

  return {
    kpis: { openTickets, resolvedToday, totalQueue: openTickets },
    tickets,
  };
};

// ─── Finance Staff Dashboard ───

export const getFinanceDashboard = async (provider_id) => {
  const today = todayStart();

  const dealers = await ProviderDealer.findMany({
    where: { provider_id, is_deleted: false },
    select: {
      id: true, name: true, email: true, city: true, credit_limit: true, status: true,
    },
  });

  let totalOutstanding = 0;
  let paymentsToday = 0;
  let overdueCount = 0;
  let creditHoldCount = 0;

  const dealerSummaries = [];

  for (const dealer of dealers) {
    const ledgerAgg = await DealerLedger.aggregate({
      where: { dealer_id: dealer.id },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } }));

    const outstanding = Math.abs(ledgerAgg._sum?.amount || 0);

    const overduePOs = await DealerPurchaseOrder.count({
      where: {
        dealer_id: dealer.id, payment_status: { in: ["PENDING", "PARTIAL"] },
        due_date: { lt: new Date() },
      },
    }).catch(() => 0);

    const todayPayments = await DealerLedger.aggregate({
      where: { dealer_id: dealer.id, transaction_type: "PAYMENT", created_at: { gte: today } },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } }));

    const creditLimit = dealer.credit_limit || 0;
    const isOverCredit = outstanding > creditLimit && creditLimit > 0;

    totalOutstanding += outstanding;
    paymentsToday += Math.abs(todayPayments._sum?.amount || 0);
    if (overduePOs > 0) overdueCount++;
    if (isOverCredit) creditHoldCount++;

    dealerSummaries.push({
      id: dealer.id, name: dealer.name, city: dealer.city,
      totalOutstanding: outstanding, creditLimit,
      overdueAmount: overduePOs > 0 ? outstanding : 0,
      isOverCredit, overduePOs,
    });
  }

  return {
    kpis: { totalOutstanding, paymentsToday, overdueInvoices: overdueCount, creditHoldDealers: creditHoldCount },
    dealers: dealerSummaries,
  };
};

// ─── Regional Manager Dashboard ───

export const getRegionalManagerDashboard = async (staff_id, provider_id) => {
  const month = monthStart();

  const assignments = await StaffDealerAssignment.findMany({
    where: { staff_id },
    include: {
      dealer: {
        select: {
          id: true, name: true, city: true, credit_limit: true, status: true,
        },
      },
    },
  });

  const dealerIds = assignments.map((a) => a.dealer.id);

  const [totalClaims, salesThisMonth] = await Promise.all([
    WarrantyClaim.count({ where: { provider_id, warranty_code_ref: { assigned_dealer_id: { in: dealerIds } } } }).catch(() => 0),
    prisma.dealerSalesEntry.count({ where: { dealer_id: { in: dealerIds }, sale_date: { gte: month } } }).catch(() => 0),
  ]);

  let totalOutstanding = 0;
  const dealerPerformance = [];

  for (const a of assignments) {
    const dealer = a.dealer;

    const unitsSold = await prisma.dealerSalesEntry.count({
      where: { dealer_id: dealer.id, sale_date: { gte: month } },
    }).catch(() => 0);

    const claimsCount = await WarrantyClaim.count({
      where: { provider_id, warranty_code_ref: { assigned_dealer_id: dealer.id } },
    }).catch(() => 0);

    const ledgerAgg = await DealerLedger.aggregate({
      where: { dealer_id: dealer.id },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } }));

    const outstanding = Math.abs(ledgerAgg._sum?.amount || 0);
    totalOutstanding += outstanding;

    const rating = unitsSold > 10 && claimsCount < 3 ? "Excellent"
      : unitsSold > 5 ? "Good"
      : unitsSold > 0 ? "Average" : "Low";

    dealerPerformance.push({
      id: dealer.id, name: dealer.name, city: dealer.city,
      unitsSold, claimsCount, outstanding, rating,
    });
  }

  return {
    kpis: {
      totalDealers: dealerIds.length,
      regionSalesMonth: salesThisMonth,
      claimsRatio: dealerIds.length > 0 ? (totalClaims / Math.max(1, salesThisMonth) * 100).toFixed(1) : "0",
      outstandingInRegion: totalOutstanding,
    },
    dealers: dealerPerformance,
  };
};
