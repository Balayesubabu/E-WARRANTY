-- Idempotent: safe if objects already exist (e.g. bootstrapped on server start)
DO $$ BEGIN
  CREATE TYPE "RoleName" AS ENUM ('SUPER_ADMIN', 'BUSINESS_OWNER', 'CUSTOMER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubRoleName" AS ENUM ('DEALER', 'STAFF', 'SERVICE_CENTER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "code" "RoleName";

CREATE UNIQUE INDEX IF NOT EXISTS "Role_code_key" ON "Role"("code");

CREATE TABLE IF NOT EXISTS "sub_roles" (
    "id" TEXT NOT NULL,
    "code" "SubRoleName" NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sub_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sub_roles_code_key" ON "sub_roles"("code");

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sub_role_id" TEXT;

DO $$ BEGIN
  ALTER TABLE "sub_roles" ADD CONSTRAINT "sub_roles_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_sub_role_id_fkey"
    FOREIGN KEY ("sub_role_id") REFERENCES "sub_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
