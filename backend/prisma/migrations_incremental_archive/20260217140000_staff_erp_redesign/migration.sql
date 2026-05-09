-- Add new StaffRoleType enum values
ALTER TYPE "StaffRoleType" ADD VALUE IF NOT EXISTS 'Admin';
ALTER TYPE "StaffRoleType" ADD VALUE IF NOT EXISTS 'ClaimsManager';
ALTER TYPE "StaffRoleType" ADD VALUE IF NOT EXISTS 'Finance';
ALTER TYPE "StaffRoleType" ADD VALUE IF NOT EXISTS 'RegionalManager';
ALTER TYPE "StaffRoleType" ADD VALUE IF NOT EXISTS 'Support';

-- Create StaffStatus enum
DO $$ BEGIN
  CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to Staff table
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "employee_id" TEXT;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "reports_to_id" TEXT;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "staff_status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "last_login" TIMESTAMP(3);
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "force_password_reset" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;

-- Add self-referencing foreign key for reports_to
DO $$ BEGIN
  ALTER TABLE "Staff" ADD CONSTRAINT "Staff_reports_to_id_fkey" FOREIGN KEY ("reports_to_id") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create StaffDealerAssignment table
CREATE TABLE IF NOT EXISTS "staff_dealer_assignments" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_dealer_assignments_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint
DO $$ BEGIN
  ALTER TABLE "staff_dealer_assignments" ADD CONSTRAINT "staff_dealer_assignments_staff_id_dealer_id_key" UNIQUE ("staff_id", "dealer_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add foreign keys
DO $$ BEGIN
  ALTER TABLE "staff_dealer_assignments" ADD CONSTRAINT "staff_dealer_assignments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "staff_dealer_assignments" ADD CONSTRAINT "staff_dealer_assignments_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "ProviderDealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "staff_dealer_assignments_staff_id_idx" ON "staff_dealer_assignments"("staff_id");
CREATE INDEX IF NOT EXISTS "staff_dealer_assignments_dealer_id_idx" ON "staff_dealer_assignments"("dealer_id");
CREATE INDEX IF NOT EXISTS "Staff_employee_id_idx" ON "Staff"("employee_id");
CREATE INDEX IF NOT EXISTS "Staff_region_idx" ON "Staff"("region");
