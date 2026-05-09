-- Add certificate_template column to provider_warranty_setting if not exists
-- NOTE: actual table name in this codebase is "ProviderWarrantySetting" (Prisma default casing)
ALTER TABLE "ProviderWarrantySetting"
ADD COLUMN IF NOT EXISTS "certificate_template" TEXT DEFAULT 'classic';
