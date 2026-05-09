-- Add certificate_template column to ProviderWarrantyCustomer for storing template used at registration
ALTER TABLE "ProviderWarrantyCustomer"
ADD COLUMN IF NOT EXISTS "certificate_template" TEXT;
