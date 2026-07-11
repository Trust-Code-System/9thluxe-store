CREATE TABLE "ConciergeConversation" (
  "id" TEXT NOT NULL, "userId" TEXT, "guestKeyHash" TEXT, "title" TEXT,
  "state" JSONB, "summary" TEXT, "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConciergeConversation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ConciergeMessage" (
  "id" TEXT NOT NULL, "conversationId" TEXT NOT NULL, "role" TEXT NOT NULL,
  "content" TEXT NOT NULL, "intent" TEXT, "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "sources" JSONB, "productRefs" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConciergeMessage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ConciergeGuestAllowance" (
  "id" TEXT NOT NULL, "guestKeyHash" TEXT NOT NULL, "successCount" INTEGER NOT NULL DEFAULT 0,
  "lastSuccessAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ConciergeGuestAllowance_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ConciergeUsageEvent" (
  "id" TEXT NOT NULL, "requestId" TEXT NOT NULL, "conversationId" TEXT, "userId" TEXT,
  "guestKeyHash" TEXT, "intent" TEXT NOT NULL, "provider" TEXT, "model" TEXT,
  "promptVersion" TEXT NOT NULL, "toolCalls" JSONB, "searchCalls" INTEGER NOT NULL DEFAULT 0,
  "inputTokens" INTEGER NOT NULL DEFAULT 0, "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "estimatedCostMicros" INTEGER NOT NULL DEFAULT 0, "firstTokenLatencyMs" INTEGER,
  "totalLatencyMs" INTEGER NOT NULL, "cacheStatus" TEXT, "completionStatus" TEXT NOT NULL,
  "errorCode" TEXT, "citationsUsed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConciergeUsageEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ConciergeFeedback" (
  "id" TEXT NOT NULL, "messageId" TEXT NOT NULL, "userId" TEXT, "guestKeyHash" TEXT,
  "rating" TEXT NOT NULL, "reportReason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConciergeFeedback_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PerfumeKnowledgeEntry" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "content" TEXT NOT NULL,
  "summary" TEXT, "category" TEXT NOT NULL, "sourceUrls" JSONB NOT NULL, "sourceTitles" JSONB NOT NULL,
  "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING', "lastVerifiedAt" TIMESTAMP(3),
  "createdBy" TEXT, "approvedBy" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PerfumeKnowledgeEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ConciergeGuestAllowance_guestKeyHash_key" ON "ConciergeGuestAllowance"("guestKeyHash");
CREATE UNIQUE INDEX "ConciergeUsageEvent_requestId_key" ON "ConciergeUsageEvent"("requestId");
CREATE UNIQUE INDEX "ConciergeFeedback_messageId_key" ON "ConciergeFeedback"("messageId");
CREATE UNIQUE INDEX "PerfumeKnowledgeEntry_slug_key" ON "PerfumeKnowledgeEntry"("slug");
CREATE INDEX "ConciergeConversation_userId_updatedAt_idx" ON "ConciergeConversation"("userId", "updatedAt");
CREATE INDEX "ConciergeConversation_guestKeyHash_updatedAt_idx" ON "ConciergeConversation"("guestKeyHash", "updatedAt");
CREATE INDEX "ConciergeMessage_conversationId_createdAt_idx" ON "ConciergeMessage"("conversationId", "createdAt");
CREATE INDEX "ConciergeUsageEvent_userId_createdAt_idx" ON "ConciergeUsageEvent"("userId", "createdAt");
CREATE INDEX "ConciergeUsageEvent_guestKeyHash_createdAt_idx" ON "ConciergeUsageEvent"("guestKeyHash", "createdAt");
CREATE INDEX "ConciergeUsageEvent_createdAt_idx" ON "ConciergeUsageEvent"("createdAt");
CREATE INDEX "ConciergeUsageEvent_intent_createdAt_idx" ON "ConciergeUsageEvent"("intent", "createdAt");
CREATE INDEX "PerfumeKnowledgeEntry_category_approvalStatus_idx" ON "PerfumeKnowledgeEntry"("category", "approvalStatus");
ALTER TABLE "ConciergeConversation" ADD CONSTRAINT "ConciergeConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConciergeMessage" ADD CONSTRAINT "ConciergeMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ConciergeConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConciergeUsageEvent" ADD CONSTRAINT "ConciergeUsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConciergeFeedback" ADD CONSTRAINT "ConciergeFeedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ConciergeMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConciergeFeedback" ADD CONSTRAINT "ConciergeFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
