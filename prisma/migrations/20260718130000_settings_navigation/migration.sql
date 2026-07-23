-- Global site settings + navigation (admin-control initiative) — additive, non-destructive.
-- Safe to run against an existing database: only creates a new enum, tables, and indexes.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "NavLocation" AS ENUM (
    'HEADER_PRIMARY',
    'HEADER_SECONDARY',
    'FOOTER_SHOP',
    'FOOTER_DISCOVER',
    'FOOTER_HELP',
    'FOOTER_COMPANY'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "NavigationItem" (
    "id" TEXT NOT NULL,
    "location" "NavLocation" NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "newTab" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NavigationItem_location_position_idx" ON "NavigationItem"("location", "position");
