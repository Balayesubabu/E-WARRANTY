-- Add new fields to ProviderDealer
ALTER TABLE "ProviderDealer" ADD COLUMN IF NOT EXISTS "credit_limit" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ProviderDealer" ADD COLUMN IF NOT EXISTS "opening_balance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ProviderDealer" ADD COLUMN IF NOT EXISTS "bank_name" TEXT;
ALTER TABLE "ProviderDealer" ADD COLUMN IF NOT EXISTS "bank_account_number" TEXT;
ALTER TABLE "ProviderDealer" ADD COLUMN IF NOT EXISTS "bank_ifsc_code" TEXT;

-- Create enums
DO $$ BEGIN
  CREATE TYPE "DealerPaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "DealerTransactionType" AS ENUM ('PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "DealerPaymentMode" AS ENUM ('CASH', 'UPI', 'NEFT', 'CHEQUE', 'BANK_TRANSFER', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create DealerPurchaseOrder table
CREATE TABLE IF NOT EXISTS "dealer_purchase_orders" (
    "id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pending_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_status" "DealerPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "due_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_purchase_orders_pkey" PRIMARY KEY ("id")
);

-- Create DealerPurchaseItem table
CREATE TABLE IF NOT EXISTS "dealer_purchase_items" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "model_number" TEXT,
    "serial_numbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealer_purchase_items_pkey" PRIMARY KEY ("id")
);

-- Create DealerSalesEntry table
CREATE TABLE IF NOT EXISTS "dealer_sales_entries" (
    "id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "model_number" TEXT,
    "serial_number" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_email" TEXT,
    "invoice_number" TEXT,
    "sale_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sale_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invoice_file" TEXT,
    "warranty_customer_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_sales_entries_pkey" PRIMARY KEY ("id")
);

-- Create DealerLedger table
CREATE TABLE IF NOT EXISTS "dealer_ledger" (
    "id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "purchase_order_id" TEXT,
    "transaction_type" "DealerTransactionType" NOT NULL DEFAULT 'PAYMENT',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_mode" "DealerPaymentMode" NOT NULL DEFAULT 'OTHER',
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference_number" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealer_ledger_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "dealer_purchase_orders_dealer_id_idx" ON "dealer_purchase_orders"("dealer_id");
CREATE INDEX IF NOT EXISTS "dealer_purchase_orders_provider_id_idx" ON "dealer_purchase_orders"("provider_id");
CREATE INDEX IF NOT EXISTS "dealer_purchase_items_purchase_order_id_idx" ON "dealer_purchase_items"("purchase_order_id");
CREATE INDEX IF NOT EXISTS "dealer_sales_entries_dealer_id_idx" ON "dealer_sales_entries"("dealer_id");
CREATE INDEX IF NOT EXISTS "dealer_sales_entries_provider_id_idx" ON "dealer_sales_entries"("provider_id");
CREATE INDEX IF NOT EXISTS "dealer_ledger_dealer_id_idx" ON "dealer_ledger"("dealer_id");
CREATE INDEX IF NOT EXISTS "dealer_ledger_provider_id_idx" ON "dealer_ledger"("provider_id");

-- Add foreign keys
DO $$ BEGIN
  ALTER TABLE "dealer_purchase_orders" ADD CONSTRAINT "dealer_purchase_orders_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "ProviderDealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "dealer_purchase_orders" ADD CONSTRAINT "dealer_purchase_orders_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "dealer_purchase_items" ADD CONSTRAINT "dealer_purchase_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "dealer_purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "dealer_sales_entries" ADD CONSTRAINT "dealer_sales_entries_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "ProviderDealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "dealer_sales_entries" ADD CONSTRAINT "dealer_sales_entries_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "dealer_ledger" ADD CONSTRAINT "dealer_ledger_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "ProviderDealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "dealer_ledger" ADD CONSTRAINT "dealer_ledger_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "dealer_ledger" ADD CONSTRAINT "dealer_ledger_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "dealer_purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
