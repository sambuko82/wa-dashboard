CREATE TABLE IF NOT EXISTS "JvtoReplyDraft" (
  "id"                 TEXT NOT NULL,
  "phone"              TEXT NOT NULL,
  "incomingMessage"    TEXT NOT NULL,
  "draft"              TEXT NOT NULL,
  "draftType"          TEXT NOT NULL,
  "templateId"         TEXT,
  "packageSlug"        TEXT,
  "confidence"         DOUBLE PRECISION,
  "riskLevel"          TEXT NOT NULL,
  "verificationStatus" TEXT NOT NULL,
  "checks"             JSONB NOT NULL,
  "failedRules"        JSONB NOT NULL,
  "notesForStaff"      JSONB NOT NULL,
  "sourceRefs"         JSONB NOT NULL,
  "sentAt"             TIMESTAMP(3),
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JvtoReplyDraft_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "JvtoReplyDraft_phone_idx"     ON "JvtoReplyDraft"("phone");
CREATE INDEX IF NOT EXISTS "JvtoReplyDraft_createdAt_idx" ON "JvtoReplyDraft"("createdAt");
