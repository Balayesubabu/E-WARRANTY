-- CreateTable
CREATE TABLE "warranty_template_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_template_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranty_templates" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout_type" TEXT NOT NULL DEFAULT 'simple',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranty_template_fields" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "section" TEXT NOT NULL DEFAULT 'default',
    "field_order" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "placeholder" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_template_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranty_registrations" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "created_by_id" TEXT,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warranty_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warranty_template_categories_slug_key" ON "warranty_template_categories"("slug");

-- CreateIndex
CREATE INDEX "warranty_templates_category_id_idx" ON "warranty_templates"("category_id");

-- CreateIndex
CREATE INDEX "warranty_templates_provider_id_idx" ON "warranty_templates"("provider_id");

-- CreateIndex
CREATE INDEX "warranty_template_fields_template_id_idx" ON "warranty_template_fields"("template_id");

-- CreateIndex
CREATE INDEX "warranty_registrations_template_id_idx" ON "warranty_registrations"("template_id");

-- CreateIndex
CREATE INDEX "warranty_registrations_provider_id_idx" ON "warranty_registrations"("provider_id");

-- AddForeignKey
ALTER TABLE "warranty_templates" ADD CONSTRAINT "warranty_templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "warranty_template_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_templates" ADD CONSTRAINT "warranty_templates_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_template_fields" ADD CONSTRAINT "warranty_template_fields_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "warranty_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_registrations" ADD CONSTRAINT "warranty_registrations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "warranty_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_registrations" ADD CONSTRAINT "warranty_registrations_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
