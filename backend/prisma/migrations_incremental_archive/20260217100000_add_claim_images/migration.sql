-- AlterTable (IF NOT EXISTS: safe when column was added earlier via db push / manual SQL)
ALTER TABLE "warranty_claims" ADD COLUMN IF NOT EXISTS "claim_images" TEXT[] DEFAULT ARRAY[]::TEXT[];
