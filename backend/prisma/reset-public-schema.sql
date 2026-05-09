-- Dev/local ONLY. Drops every table in `public` (irreversible data loss).
-- Fixes Prisma P3005 ("schema is not empty") when `migrate deploy` refuses to run.
--
-- One command from backend/:  npm run prisma:local-bootstrap
--   (= execute this file + migrate deploy + prisma generate + seed)
--
-- Production: never run this. Use only `npm run prisma:migrate:prod` on servers.
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
