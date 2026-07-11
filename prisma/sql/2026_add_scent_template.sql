-- Additive, nullable column that stores an admin's chosen visual scent template per product.
-- Safe and reversible: adds one column, touches no existing data, and is applied idempotently by
-- lib/fragrance/template-store.ts:ensureScentTemplateColumn() the first time a template is saved.
-- Intentionally NOT part of the Prisma model, so product reads never break in an environment where
-- this column has not yet been applied (the storefront falls back to the recommended template).

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "scentTemplate" TEXT;

-- To reverse:
-- ALTER TABLE "Product" DROP COLUMN IF EXISTS "scentTemplate";
