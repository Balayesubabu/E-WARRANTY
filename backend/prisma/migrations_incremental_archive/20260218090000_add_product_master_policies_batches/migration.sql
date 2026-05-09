-- CreateEnum: WarrantyStartRule
DO $$ BEGIN
  CREATE TYPE "WarrantyStartRule" AS ENUM ('FROM_INVOICE_DATE', 'FROM_ACTIVATION', 'FROM_DISPATCH_DATE', 'FROM_MANUFACTURING_DATE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: CoverageType
DO $$ BEGIN
  CREATE TYPE "CoverageType" AS ENUM ('REPAIR_ONLY', 'REPLACEMENT_ONLY', 'BOTH');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: CoverageScope
DO $$ BEGIN
  CREATE TYPE "CoverageScope" AS ENUM ('PARTS_ONLY', 'LABOR_ONLY', 'FULL_COVERAGE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: BatchStatus
DO $$ BEGIN
  CREATE TYPE "BatchStatus" AS ENUM ('GENERATED', 'PARTIALLY_ASSIGNED', 'FULLY_ASSIGNED', 'DEPLETED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateTable: product_master
CREATE TABLE IF NOT EXISTS "product_master" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "model_number" TEXT,
    "sku_code" TEXT,
    "category" TEXT,
    "brand" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable: warranty_policies
CREATE TABLE IF NOT EXISTS "warranty_policies" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "product_master_id" TEXT NOT NULL,
    "policy_name" TEXT NOT NULL,
    "warranty_duration_days" INTEGER NOT NULL,
    "warranty_duration_label" TEXT NOT NULL,
    "start_rule" "WarrantyStartRule" NOT NULL DEFAULT 'FROM_ACTIVATION',
    "coverage_type" "CoverageType" NOT NULL DEFAULT 'BOTH',
    "coverage_scope" "CoverageScope" NOT NULL DEFAULT 'FULL_COVERAGE',
    "claim_approval_required" BOOLEAN NOT NULL DEFAULT true,
    "escalation_days" INTEGER,
    "max_claim_count" INTEGER,
    "terms_and_conditions" TEXT,
    "terms_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: warranty_batches
CREATE TABLE IF NOT EXISTS "warranty_batches" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "product_master_id" TEXT NOT NULL,
    "warranty_policy_id" TEXT NOT NULL,
    "batch_name" TEXT NOT NULL,
    "serial_prefix" TEXT,
    "total_units" INTEGER NOT NULL,
    "code_prefix" TEXT NOT NULL,
    "assigned_dealer_id" TEXT,
    "policy_snapshot" JSONB,
    "status" "BatchStatus" NOT NULL DEFAULT 'GENERATED',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_batches_pkey" PRIMARY KEY ("id")
);

-- Add batch_id to existing warranty codes table
ALTER TABLE "ProviderProductWarrantyCode" ADD COLUMN IF NOT EXISTS "batch_id" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_master_provider_id_idx" ON "product_master"("provider_id");
CREATE INDEX IF NOT EXISTS "warranty_policies_provider_id_idx" ON "warranty_policies"("provider_id");
CREATE INDEX IF NOT EXISTS "warranty_policies_product_master_id_idx" ON "warranty_policies"("product_master_id");
CREATE INDEX IF NOT EXISTS "warranty_batches_provider_id_idx" ON "warranty_batches"("provider_id");
CREATE INDEX IF NOT EXISTS "warranty_batches_product_master_id_idx" ON "warranty_batches"("product_master_id");
CREATE INDEX IF NOT EXISTS "warranty_batches_warranty_policy_id_idx" ON "warranty_batches"("warranty_policy_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "product_master" ADD CONSTRAINT "product_master_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "warranty_policies" ADD CONSTRAINT "warranty_policies_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "warranty_policies" ADD CONSTRAINT "warranty_policies_product_master_id_fkey" FOREIGN KEY ("product_master_id") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "warranty_batches" ADD CONSTRAINT "warranty_batches_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "warranty_batches" ADD CONSTRAINT "warranty_batches_product_master_id_fkey" FOREIGN KEY ("product_master_id") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "warranty_batches" ADD CONSTRAINT "warranty_batches_warranty_policy_id_fkey" FOREIGN KEY ("warranty_policy_id") REFERENCES "warranty_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "warranty_batches" ADD CONSTRAINT "warranty_batches_assigned_dealer_id_fkey" FOREIGN KEY ("assigned_dealer_id") REFERENCES "ProviderDealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ProviderProductWarrantyCode" ADD CONSTRAINT "ProviderProductWarrantyCode_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "warranty_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
