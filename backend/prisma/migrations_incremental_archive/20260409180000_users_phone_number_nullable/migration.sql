-- Email-only customers: store NULL instead of a temp_* placeholder (unique allows multiple NULLs in PostgreSQL).
ALTER TABLE "users" ALTER COLUMN "phone_number" DROP NOT NULL;

-- Optional cleanup: OTP email-only rows that used numeric temp_ placeholders
UPDATE "users"
SET "phone_number" = NULL
WHERE "user_type" = 'customer'
  AND "auth_provider" = 'otp'
  AND "phone_number" ~ '^temp_[0-9]+$';
