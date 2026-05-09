import { prisma } from "../prisma/db-models.js";
import { logger } from "../services/logger.js";

/** True when migration `add_canonical_roles_sub_roles` has been applied (Role.code + sub_roles exist). */
async function isCanonicalRolesSchemaReady() {
  try {
    const rows = await prisma.$queryRaw`
      SELECT 1 AS ok
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'code'
        AND table_name IN ('Role', 'role')
      LIMIT 1
    `;
    if (!rows?.length) return false;
    const sub = await prisma.$queryRaw`
      SELECT 1 AS ok
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'sub_roles'
      LIMIT 1
    `;
    return Boolean(sub?.length);
  } catch {
    return false;
  }
}

/**
 * Creates enums, Role.code, sub_roles, users.sub_role_id when migrations were not applied.
 * Idempotent: safe to run on every server start.
 */
async function bootstrapCanonicalRolesSchema() {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "RoleName" AS ENUM ('SUPER_ADMIN', 'BUSINESS_OWNER', 'CUSTOMER');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "SubRoleName" AS ENUM ('DEALER', 'STAFF', 'SERVICE_CENTER');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "code" "RoleName";
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Role_code_key" ON "Role"("code");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "sub_roles" (
      "id" TEXT NOT NULL,
      "code" "SubRoleName" NOT NULL,
      "role_id" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "sub_roles_pkey" PRIMARY KEY ("id")
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "sub_roles_code_key" ON "sub_roles"("code");
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sub_role_id" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "sub_roles" ADD CONSTRAINT "sub_roles_role_id_fkey"
        FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "users" ADD CONSTRAINT "users_sub_role_id_fkey"
        FOREIGN KEY ("sub_role_id") REFERENCES "sub_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  logger.info('Canonical roles schema ensured (Role.code, sub_roles, enums, FKs).');
}

const isProduction = () => String(process.env.NODE_ENV || "").toLowerCase() === "production";
const allowDbBootstrap = () => String(process.env.ALLOW_DB_BOOTSTRAP || "").toLowerCase() === "true";

/**
 * Ensure a Role row exists with the given Prisma RoleName code.
 * Merges legacy rows (e.g. name "customer" without code) instead of duplicating.
 */
async function ensureRole(code, name, description) {
  const orFilters = [{ code }];
  if (code === "CUSTOMER") orFilters.push({ name: "customer" });
  if (code === "SUPER_ADMIN") orFilters.push({ name: "super_admin" });
  if (code === "BUSINESS_OWNER") orFilters.push({ name: "business_owner" }, { name: "owner" });

  let row = await prisma.role.findFirst({
    where: { is_deleted: false, OR: orFilters },
  });

  if (row) {
    row = await prisma.role.update({
      where: { id: row.id },
      data: {
        code,
        name,
        description,
        is_active: true,
        is_deleted: false,
      },
    });
    return row;
  }

  return prisma.role.create({
    data: { code, name, description },
  });
}

/**
 * When migrations for Role.code + sub_roles are not applied yet, insert base Role rows
 * using only legacy columns (matches your current "Role" table in PostgreSQL).
 */
async function seedLegacyRolesWithoutCanonicalColumns() {
  const roles = [
    { name: "super_admin", description: "Platform super administrator" },
    { name: "business_owner", description: "Business / provider umbrella role" },
    { name: "customer", description: "Customer role" },
  ];
  for (const { name, description } of roles) {
    await prisma.$executeRaw`
      INSERT INTO "Role" (id, name, description, is_active, is_deleted)
      SELECT gen_random_uuid()::text, ${name}, ${description}, true, false
      WHERE NOT EXISTS (
        SELECT 1 FROM "Role" r WHERE r.name = ${name} AND r.is_deleted = false
      )
    `;
  }
  logger.info(
    "Legacy Role rows ensured (super_admin, business_owner, customer)."
  );
}

/**
 * Idempotent seed: canonical Role + SubRole rows for JWT / authorize middleware.
 * Bootstraps DB objects if migrations were never applied, then seeds data.
 */
export async function seedCanonicalRoles() {
  let ready = await isCanonicalRolesSchemaReady();

  if (!ready) {
    // Production safety: never auto-mutate schema on server start.
    // In local/dev you can opt-in by setting ALLOW_DB_BOOTSTRAP=true.
    if (isProduction() && !allowDbBootstrap()) {
      logger.warn(
        "Canonical roles schema is missing (Role.code / sub_roles). Skipping schema bootstrap in production. Apply migrations via CI/CD, or set ALLOW_DB_BOOTSTRAP=true explicitly."
      );
    } else if (allowDbBootstrap()) {
      try {
        await bootstrapCanonicalRolesSchema();
        ready = await isCanonicalRolesSchemaReady();
      } catch (e) {
        logger.error(`Canonical roles schema bootstrap failed: ${e?.message || e}`);
      }
    } else {
      logger.warn(
        "Canonical roles schema is missing (Role.code / sub_roles). Set ALLOW_DB_BOOTSTRAP=true to let the app create required DB objects locally."
      );
    }
  }

  if (!ready) {
    logger.warn(
      "sub_roles / Role.code still missing — seeding legacy Role names only. Check DB permissions and logs."
    );
    try {
      await seedLegacyRolesWithoutCanonicalColumns();
    } catch (e) {
      logger.error(`Legacy role seed failed: ${e?.message || e}`);
    }
    return;
  }

  try {
    const superAdmin = await ensureRole(
      "SUPER_ADMIN",
      "super_admin",
      "Platform super administrator"
    );

    const businessOwner = await ensureRole(
      "BUSINESS_OWNER",
      "business_owner",
      "Business / provider umbrella role"
    );

    await ensureRole("CUSTOMER", "customer", "Customer role");

    const subPairs = [
      { code: "DEALER", role_id: businessOwner.id },
      { code: "STAFF", role_id: businessOwner.id },
      { code: "SERVICE_CENTER", role_id: businessOwner.id },
    ];

    for (const { code, role_id } of subPairs) {
      await prisma.subRole.upsert({
        where: { code },
        create: { code, role_id },
        update: { role_id },
      });
    }

    logger.info(
      `Canonical roles seeded (SUPER_ADMIN=${superAdmin.id}, BUSINESS_OWNER=${businessOwner.id}, sub_roles: DEALER/STAFF/SERVICE_CENTER)`
    );
  } catch (e) {
    logger.error(`Canonical role data seed failed: ${e?.message || e}`);
    try {
      await seedLegacyRolesWithoutCanonicalColumns();
    } catch (e2) {
      logger.error(`Legacy role fallback failed: ${e2?.message || e2}`);
    }
  }
}
