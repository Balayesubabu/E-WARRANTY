-- Add Google authentication support on existing users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_sub" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_provider" TEXT NOT NULL DEFAULT 'password';

CREATE UNIQUE INDEX IF NOT EXISTS "users_google_sub_key" ON "users"("google_sub");
