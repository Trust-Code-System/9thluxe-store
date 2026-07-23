-- MANUAL ROLLBACK ONLY. Export managed content and customer notes first.
DROP TABLE IF EXISTS "EmailTemplate";
DROP TABLE IF EXISTS "ProductRelation";
DROP TABLE IF EXISTS "ContentRevision";
DROP TABLE IF EXISTS "Redirect";
DROP TABLE IF EXISTS "CampaignProduct";
DROP TABLE IF EXISTS "Campaign";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "seoDescription", DROP COLUMN IF EXISTS "seoTitle";
ALTER TABLE "Collection" DROP COLUMN IF EXISTS "seoDescription", DROP COLUMN IF EXISTS "seoTitle";
ALTER TABLE "User" DROP COLUMN IF EXISTS "customerStatus", DROP COLUMN IF EXISTS "customerSegment", DROP COLUMN IF EXISTS "customerNotes", DROP COLUMN IF EXISTS "customerTags";
