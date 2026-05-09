-- Drops Reseller Program tables/enums only.
-- Safe to run multiple times.

-- Drop tables first (they depend on the enum and provider FKs).
DROP TABLE IF EXISTS "reseller_commissions" CASCADE;
DROP TABLE IF EXISTS "reseller_profiles" CASCADE;

-- Drop enum (name as created by Prisma for the ResellerStatus enum).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ResellerStatus') THEN
    DROP TYPE "ResellerStatus";
  END IF;
END$$;

