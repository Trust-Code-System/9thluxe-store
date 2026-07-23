-- Campaigns, redirects, revisions, product coverage, customer depth, and email templates.
-- Additive and non-destructive.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customerTags" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customerNotes" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customerSegment" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customerStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;

CREATE TABLE IF NOT EXISTS "Campaign" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT,
  "desktopImage" TEXT, "mobileImage" TEXT, "ctaLabel" TEXT, "ctaHref" TEXT,
  "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT', "startsAt" TIMESTAMP(3), "endsAt" TIMESTAMP(3),
  "couponId" TEXT, "createdBy" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "CampaignProduct" (
  "campaignId" TEXT NOT NULL, "productId" TEXT NOT NULL, "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "CampaignProduct_pkey" PRIMARY KEY ("campaignId", "productId")
);
CREATE TABLE IF NOT EXISTS "Redirect" (
  "id" TEXT NOT NULL, "source" TEXT NOT NULL, "destination" TEXT NOT NULL,
  "permanent" BOOLEAN NOT NULL DEFAULT true, "active" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ContentRevision" (
  "id" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL, "createdBy" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ProductRelation" (
  "sourceId" TEXT NOT NULL, "targetId" TEXT NOT NULL, "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProductRelation_pkey" PRIMARY KEY ("sourceId", "targetId")
);
CREATE TABLE IF NOT EXISTS "EmailTemplate" (
  "id" TEXT NOT NULL, "key" TEXT NOT NULL, "name" TEXT NOT NULL, "subject" TEXT NOT NULL,
  "bodyText" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT false, "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Campaign_slug_key" ON "Campaign"("slug");
CREATE INDEX IF NOT EXISTS "Campaign_status_startsAt_endsAt_idx" ON "Campaign"("status", "startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "CampaignProduct_campaignId_position_idx" ON "CampaignProduct"("campaignId", "position");
CREATE UNIQUE INDEX IF NOT EXISTS "Redirect_source_key" ON "Redirect"("source");
CREATE UNIQUE INDEX IF NOT EXISTS "ContentRevision_entityType_entityId_version_key" ON "ContentRevision"("entityType", "entityId", "version");
CREATE INDEX IF NOT EXISTS "ContentRevision_entityType_entityId_createdAt_idx" ON "ContentRevision"("entityType", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductRelation_sourceId_position_idx" ON "ProductRelation"("sourceId", "position");
CREATE UNIQUE INDEX IF NOT EXISTS "EmailTemplate_key_key" ON "EmailTemplate"("key");

DO $$ BEGIN ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "CampaignProduct" ADD CONSTRAINT "CampaignProduct_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "CampaignProduct" ADD CONSTRAINT "CampaignProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
