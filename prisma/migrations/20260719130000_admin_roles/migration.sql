-- Granular admin roles (admin-control initiative) — additive, non-destructive.
-- Adds an AdminRole enum and a nullable User.adminRole column. Existing admins keep full access:
-- a NULL adminRole with role=ADMIN is treated as SUPER_ADMIN in application code.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "AdminRole" AS ENUM (
    'SUPER_ADMIN',
    'CONTENT_MANAGER',
    'PRODUCT_MANAGER',
    'ORDER_MANAGER',
    'MARKETING_MANAGER',
    'ANALYST'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminRole" "AdminRole";
