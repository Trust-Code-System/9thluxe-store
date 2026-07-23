-- Story CMS (admin-control initiative) — additive, non-destructive.
-- Replaces the hard-coded lib/journal-articles.ts array with a managed content model.
-- Safe to run against an existing database: only creates new tables + indexes.
-- Reuses the existing "PublishStatus" enum (DRAFT | PUBLISHED | ARCHIVED).

-- CreateTable
CREATE TABLE IF NOT EXISTS "Story" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "excerpt" TEXT,
    "category" TEXT,
    "readTime" TEXT,
    "author" TEXT,
    "tags" TEXT,
    "coverImageUrl" TEXT,
    "mobileCoverUrl" TEXT,
    "socialImageUrl" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "unpublishAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StoryBlock" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,

    CONSTRAINT "StoryBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StoryProduct" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StoryProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Story_slug_key" ON "Story"("slug");
CREATE INDEX IF NOT EXISTS "Story_status_publishedAt_idx" ON "Story"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "Story_featured_position_idx" ON "Story"("featured", "position");
CREATE INDEX IF NOT EXISTS "Story_deletedAt_idx" ON "Story"("deletedAt");
CREATE INDEX IF NOT EXISTS "StoryBlock_storyId_position_idx" ON "StoryBlock"("storyId", "position");
CREATE UNIQUE INDEX IF NOT EXISTS "StoryProduct_storyId_productId_key" ON "StoryProduct"("storyId", "productId");
CREATE INDEX IF NOT EXISTS "StoryProduct_storyId_position_idx" ON "StoryProduct"("storyId", "position");

-- AddForeignKey
ALTER TABLE "StoryBlock" ADD CONSTRAINT "StoryBlock_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryProduct" ADD CONSTRAINT "StoryProduct_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryProduct" ADD CONSTRAINT "StoryProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
