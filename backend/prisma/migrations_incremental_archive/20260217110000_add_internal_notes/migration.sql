-- AlterTable - Add internal_notes to warranty_claims
ALTER TABLE "warranty_claims" ADD COLUMN IF NOT EXISTS "internal_notes" TEXT;

-- AlterTable - Add internal_notes to ProviderWarrantyCustomer
ALTER TABLE "ProviderWarrantyCustomer" ADD COLUMN IF NOT EXISTS "internal_notes" TEXT;
