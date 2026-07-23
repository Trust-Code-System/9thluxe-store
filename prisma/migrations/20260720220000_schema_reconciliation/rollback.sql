DROP INDEX IF EXISTS "User_referralCode_key";
DROP INDEX IF EXISTS "Order_userId_createdAt_idx";

ALTER TABLE "User"
  DROP COLUMN IF EXISTS "totalLifetimeSpend",
  DROP COLUMN IF EXISTS "referredBy",
  DROP COLUMN IF EXISTS "referralCode",
  DROP COLUMN IF EXISTS "loyaltyTier";

ALTER TABLE "Order"
  DROP COLUMN IF EXISTS "shippingNGN",
  DROP COLUMN IF EXISTS "paymentMethod",
  DROP COLUMN IF EXISTS "isGift",
  DROP COLUMN IF EXISTS "giftWrapping",
  DROP COLUMN IF EXISTS "giftMessage";
