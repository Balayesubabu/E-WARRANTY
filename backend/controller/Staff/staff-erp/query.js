import {
  Provider, Staff, StaffDealerAssignment, ProviderDealer,
  WarrantyClaim, ProviderWarrantyCustomer,
} from "../../../prisma/db-models.js";
import { prisma } from "../../../prisma/db-models.js";

// ─── Provider lookup ───

export const getProviderByUserId = async (user_id) => {
  return Provider.findFirst({ where: { user_id } });
};

// ─── Staff Detail (with relations) ───

export const getStaffDetailById = async (staff_id) => {
  return Staff.findUnique({
    where: { id: staff_id },
    include: {
      reports_to: { select: { id: true, name: true, email: true, role_type: true } },
      subordinates: { select: { id: true, name: true, email: true, role_type: true } },
      dealer_assignments: {
        include: {
          dealer: { select: { id: true, name: true, email: true, city: true, status: true } },
        },
      },
      WarrantyClaim: {
        select: { id: true, status: true, created_at: true },
        orderBy: { created_at: "desc" },
        take: 20,
      },
      StaffRolePermission: true,
    },
  });
};

// ─── Staff performance stats ───

export const getStaffPerformanceStats = async (staff_id, provider_id) => {
  const claimsProcessed = await WarrantyClaim.count({ where: { assigned_staff_id: staff_id } });

  const claimsByStatus = await WarrantyClaim.groupBy({
    by: ["status"],
    where: { assigned_staff_id: staff_id },
    _count: true,
  });

  const dealerCount = await StaffDealerAssignment.count({ where: { staff_id } });

  const ticketCount = await prisma.supportTicket.count({
    where: { provider_id },
  }).catch(() => 0);

  return {
    claimsProcessed,
    claimsByStatus: claimsByStatus.reduce((acc, c) => { acc[c.status] = c._count; return acc; }, {}),
    dealersManaged: dealerCount,
    ticketsHandled: ticketCount,
  };
};

// ─── Dealer Assignment ───

export const assignDealersToStaff = async (staff_id, dealer_ids) => {
  await StaffDealerAssignment.deleteMany({ where: { staff_id } });

  if (!dealer_ids || dealer_ids.length === 0) return [];

  const assignments = [];
  for (const dealer_id of dealer_ids) {
    const a = await StaffDealerAssignment.create({
      data: { staff_id, dealer_id },
    });
    assignments.push(a);
  }
  return assignments;
};

export const getStaffDealerAssignments = async (staff_id) => {
  return StaffDealerAssignment.findMany({
    where: { staff_id },
    include: {
      dealer: { select: { id: true, name: true, email: true, city: true, status: true } },
    },
  });
};

// ─── Get all dealers for the provider (for assignment dropdown) ───

export const getAllDealersForProvider = async (provider_id) => {
  return ProviderDealer.findMany({
    where: { provider_id, is_deleted: false },
    select: { id: true, name: true, email: true, city: true, status: true },
    orderBy: { name: "asc" },
  });
};

// ─── All staff for provider (with new fields) ───

export const getAllStaffForProvider = async (provider_id, franchise_id) => {
  const staffList = await Staff.findMany({
    where: { provider_id, franchise_id },
    include: {
      reports_to: { select: { id: true, name: true } },
      dealer_assignments: {
        include: {
          dealer: { select: { id: true, name: true } },
        },
      },
      StaffRolePermission: {
        where: { is_deleted: false },
        select: { sub_module_id: true, module_id: true, access_type: true },
      },
    },
    orderBy: { created_at: "desc" },
  });

  for (let i = 0; i < staffList.length; i++) {
    if (staffList[i].department_id) {
      const dept = await prisma.department.findFirst({
        where: { id: staffList[i].department_id },
      });
      staffList[i].department_name = dept?.department_name || null;
    }
  }

  return staffList;
};
