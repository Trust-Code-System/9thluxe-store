-- Homepage section layout (admin-control initiative) — additive, non-destructive.
-- Creates one table controlling homepage section order, visibility, and copy overrides.

-- CreateTable
CREATE TABLE IF NOT EXISTS "HomepageSection" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "HomepageSection_type_key" ON "HomepageSection"("type");
CREATE INDEX IF NOT EXISTS "HomepageSection_position_idx" ON "HomepageSection"("position");
