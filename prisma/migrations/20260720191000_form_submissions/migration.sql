-- Durable forms/enquiries inbox (admin-control initiative) - additive and non-destructive.

DO $$ BEGIN
  CREATE TYPE "FormSubmissionStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "FormSubmission" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'contact',
    "name" TEXT,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" "FormSubmissionStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FormSubmission_status_createdAt_idx" ON "FormSubmission"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "FormSubmission_source_createdAt_idx" ON "FormSubmission"("source", "createdAt");
CREATE INDEX IF NOT EXISTS "FormSubmission_email_createdAt_idx" ON "FormSubmission"("email", "createdAt");
