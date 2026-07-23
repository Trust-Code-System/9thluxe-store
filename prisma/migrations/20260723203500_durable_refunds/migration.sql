CREATE TYPE "RefundStatus" AS ENUM (
  'REQUESTED',
  'PENDING',
  'PROCESSING',
  'NEEDS_ATTENTION',
  'PROCESSED',
  'FAILED'
);

CREATE TABLE "Refund" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "paymentAttemptId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'paystack',
  "providerRefundId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "amountNGN" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "previousOrderStatus" "OrderStatus" NOT NULL,
  "restock" BOOLEAN NOT NULL DEFAULT false,
  "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
  "initiatedBy" TEXT,
  "failureCode" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Refund_orderId_key" ON "Refund"("orderId");
CREATE UNIQUE INDEX "Refund_paymentAttemptId_key" ON "Refund"("paymentAttemptId");
CREATE UNIQUE INDEX "Refund_providerRefundId_key" ON "Refund"("providerRefundId");
CREATE UNIQUE INDEX "Refund_idempotencyKey_key" ON "Refund"("idempotencyKey");
CREATE INDEX "Refund_status_createdAt_idx" ON "Refund"("status", "createdAt");

ALTER TABLE "Refund"
ADD CONSTRAINT "Refund_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Refund"
ADD CONSTRAINT "Refund_paymentAttemptId_fkey"
FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
