-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "WarrantyClaimStatus" AS ENUM ('Submitted', 'Approved', 'InProgress', 'Repaired', 'Replaced', 'Closed', 'Rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "warranty_claims" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "franchise_id" TEXT NOT NULL,
    "warranty_customer_id" TEXT NOT NULL,
    "warranty_code_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_phone" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "warranty_code" TEXT,
    "issue_description" TEXT NOT NULL,
    "issue_category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" "WarrantyClaimStatus" NOT NULL DEFAULT 'Submitted',
    "resolution_notes" TEXT,
    "assigned_staff_id" TEXT,
    "rejection_reason" TEXT,
    "closed_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "warranty_claim_history" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "previous_status" "WarrantyClaimStatus",
    "new_status" "WarrantyClaimStatus" NOT NULL,
    "message" TEXT,
    "changed_by_id" TEXT,
    "changed_by_role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warranty_claim_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "warranty_claims_provider_id_idx" ON "warranty_claims"("provider_id");
CREATE INDEX IF NOT EXISTS "warranty_claims_warranty_customer_id_idx" ON "warranty_claims"("warranty_customer_id");
CREATE INDEX IF NOT EXISTS "warranty_claims_status_idx" ON "warranty_claims"("status");
CREATE INDEX IF NOT EXISTS "warranty_claim_history_claim_id_idx" ON "warranty_claim_history"("claim_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_warranty_customer_id_fkey" FOREIGN KEY ("warranty_customer_id") REFERENCES "ProviderWarrantyCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_warranty_code_id_fkey" FOREIGN KEY ("warranty_code_id") REFERENCES "ProviderProductWarrantyCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "warranty_claim_history" ADD CONSTRAINT "warranty_claim_history_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "warranty_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
