-- Static/editorial Pages CMS (admin-control initiative) - additive and non-destructive.
-- Legal pages remain source-controlled; this table manages about, faq, and help routes.

CREATE TABLE IF NOT EXISTS "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eyebrow" TEXT,
    "excerpt" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "unpublishAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PageBlock" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,
    CONSTRAINT "PageBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Page_slug_key" ON "Page"("slug");
CREATE INDEX IF NOT EXISTS "Page_status_publishedAt_idx" ON "Page"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "Page_deletedAt_idx" ON "Page"("deletedAt");
CREATE INDEX IF NOT EXISTS "PageBlock_pageId_position_idx" ON "PageBlock"("pageId", "position");

DO $$ BEGIN
  ALTER TABLE "PageBlock" ADD CONSTRAINT "PageBlock_pageId_fkey"
    FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
