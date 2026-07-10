-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMedia" DROP CONSTRAINT "ProductMedia_productId_fkey";

-- DropForeignKey
ALTER TABLE "BackInStockSubscription" DROP CONSTRAINT "BackInStockSubscription_productId_fkey";

-- DropForeignKey
ALTER TABLE "BackInStockSubscription" DROP CONSTRAINT "BackInStockSubscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "ScentProfile" DROP CONSTRAINT "ScentProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "ScentQuizSession" DROP CONSTRAINT "ScentQuizSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "ConsentRecord" DROP CONSTRAINT "ConsentRecord_userId_fkey";

-- DropForeignKey
ALTER TABLE "LoyaltyLedger" DROP CONSTRAINT "LoyaltyLedger_userId_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_referrerId_fkey";

-- DropForeignKey
ALTER TABLE "SampleCredit" DROP CONSTRAINT "SampleCredit_userId_fkey";

-- DropForeignKey
ALTER TABLE "CreditRedemption" DROP CONSTRAINT "CreditRedemption_creditId_fkey";

-- DropForeignKey
ALTER TABLE "DiscoverySet" DROP CONSTRAINT "DiscoverySet_userId_fkey";

-- DropForeignKey
ALTER TABLE "DiscoverySetItem" DROP CONSTRAINT "DiscoverySetItem_setId_fkey";

-- DropForeignKey
ALTER TABLE "SupportConversation" DROP CONSTRAINT "SupportConversation_userId_fkey";

-- DropIndex
DROP INDEX "Product_shopifyId_key";

-- DropIndex
DROP INDEX "Product_sku_key";

-- DropIndex
DROP INDEX "Product_publishStatus_idx";

-- DropIndex
DROP INDEX "Product_brand_idx";

-- DropIndex
DROP INDEX "Review_moderationStatus_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "authenticityStatus",
DROP COLUMN "barcode",
DROP COLUMN "batchInfo",
DROP COLUMN "beginnerFriendly",
DROP COLUMN "climate",
DROP COLUMN "concentration",
DROP COLUMN "costPriceNGN",
DROP COLUMN "countryOfOrigin",
DROP COLUMN "intensity",
DROP COLUMN "internalAuthNotes",
DROP COLUMN "isPreorder",
DROP COLUMN "isWaitlist",
DROP COLUMN "lastVerifiedAt",
DROP COLUMN "launchYear",
DROP COLUMN "mainAccords",
DROP COLUMN "moodTags",
DROP COLUMN "olfactoryDesc",
DROP COLUMN "perfumer",
DROP COLUMN "publishStatus",
DROP COLUMN "reorderPoint",
DROP COLUMN "returnEligible",
DROP COLUMN "searchSynonyms",
DROP COLUMN "season",
DROP COLUMN "shippingClass",
DROP COLUMN "shopifyId",
DROP COLUMN "sillage",
DROP COLUMN "sku",
DROP COLUMN "sprayGuidance",
DROP COLUMN "supplierId",
DROP COLUMN "timeOfDay",
DROP COLUMN "weightGrams",
ADD COLUMN     "lensType" TEXT,
ADD COLUMN     "material" TEXT,
ADD COLUMN     "warranty" TEXT,
ADD COLUMN     "waterResistance" TEXT;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "application",
DROP COLUMN "climate",
DROP COLUMN "editedAt",
DROP COLUMN "longevityRating",
DROP COLUMN "moderatedAt",
DROP COLUMN "moderatedBy",
DROP COLUMN "moderationStatus",
DROP COLUMN "occasion",
DROP COLUMN "orderId",
DROP COLUMN "reportedCount",
DROP COLUMN "sillageRating",
DROP COLUMN "valueRating",
DROP COLUMN "verifiedPurchase";

-- DropTable
DROP TABLE "ProductVariant";

-- DropTable
DROP TABLE "ProductMedia";

-- DropTable
DROP TABLE "Supplier";

-- DropTable
DROP TABLE "BackInStockSubscription";

-- DropTable
DROP TABLE "ScentProfile";

-- DropTable
DROP TABLE "ScentQuizSession";

-- DropTable
DROP TABLE "ConsentRecord";

-- DropTable
DROP TABLE "LoyaltyLedger";

-- DropTable
DROP TABLE "Referral";

-- DropTable
DROP TABLE "SampleCredit";

-- DropTable
DROP TABLE "CreditRedemption";

-- DropTable
DROP TABLE "DiscoverySet";

-- DropTable
DROP TABLE "DiscoverySetItem";

-- DropTable
DROP TABLE "SupportConversation";

-- DropTable
DROP TABLE "NotificationLog";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "ApprovalRequest";

-- DropTable
DROP TABLE "RecommendationRequest";

-- DropTable
DROP TABLE "IntegrationEvent";

-- DropTable
DROP TABLE "WebhookReceipt";

-- DropTable
DROP TABLE "IdempotencyKey";

-- DropTable
DROP TABLE "JobRun";

-- DropTable
DROP TABLE "FeatureFlag";

-- DropEnum
DROP TYPE "PublishStatus";

-- DropEnum
DROP TYPE "AuthenticityStatus";

-- DropEnum
DROP TYPE "ModerationStatus";

-- DropEnum
DROP TYPE "ApprovalStatus";

-- DropEnum
DROP TYPE "JobStatus";

