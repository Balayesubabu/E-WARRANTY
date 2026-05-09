import { prisma } from "../prisma/db-models.js";

/**
 * Resolve the CUSTOMER Role row (seeded or legacy name) and create if missing.
 * @param {import("@prisma/client").Prisma.TransactionClient} [tx]
 */
export async function ensureCustomerRole(tx = prisma) {
  let role = await tx.role.findFirst({
    where: {
      is_deleted: false,
      OR: [{ code: "CUSTOMER" }, { name: "customer" }],
    },
  });
  if (!role) {
    role = await tx.role.create({
      data: {
        code: "CUSTOMER",
        name: "customer",
        description: "Customer role",
      },
    });
  }
  return role;
}

/**
 * Resolve the BUSINESS_OWNER Role row and create if missing.
 * @param {import("@prisma/client").Prisma.TransactionClient} [tx]
 */
export async function ensureBusinessOwnerRole(tx = prisma) {
  let role = await tx.role.findFirst({
    where: {
      is_deleted: false,
      OR: [
        { code: "BUSINESS_OWNER" },
        { name: "business_owner" },
        { name: "owner" },
      ],
    },
  });
  if (!role) {
    role = await tx.role.create({
      data: {
        code: "BUSINESS_OWNER",
        name: "business_owner",
        description: "Business / provider umbrella role",
      },
    });
  }
  return role;
}
