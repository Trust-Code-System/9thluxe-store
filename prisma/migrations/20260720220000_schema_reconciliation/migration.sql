-- Reconcile Prisma fields that predated the admin-control migrations but were absent from the
-- migration chain. Additive and safe for databases where any of these columns already exist.

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "giftMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "giftWrapping" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isGift" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'CARD',
  ADD COLUMN IF NOT EXISTS "shippingNGN" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Product" ALTER COLUMN "category" DROP DEFAULT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "loyaltyTier" TEXT NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN IF NOT EXISTS "referralCode" TEXT,
  ADD COLUMN IF NOT EXISTS "referredBy" TEXT,
  ADD COLUMN IF NOT EXISTS "totalLifetimeSpend" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");
