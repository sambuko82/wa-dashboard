-- Indexes for foreign keys and common filter columns
-- Applied directly to DB via script; recorded here for migration history

CREATE INDEX IF NOT EXISTS "MessageLog_numberId_idx" ON "MessageLog"("numberId");
CREATE INDEX IF NOT EXISTS "MessageLog_contactId_idx" ON "MessageLog"("contactId");
CREATE INDEX IF NOT EXISTS "MessageLog_createdAt_idx" ON "MessageLog"("createdAt");
CREATE INDEX IF NOT EXISTS "Contact_waNumberId_idx" ON "Contact"("waNumberId");
CREATE INDEX IF NOT EXISTS "Contact_pipelineStageId_idx" ON "Contact"("pipelineStageId");
CREATE INDEX IF NOT EXISTS "PipelineStage_userId_idx" ON "PipelineStage"("userId");
CREATE INDEX IF NOT EXISTS "Reminder_contactId_idx" ON "Reminder"("contactId");
CREATE INDEX IF NOT EXISTS "Reminder_dueDate_idx" ON "Reminder"("dueDate");
CREATE INDEX IF NOT EXISTS "Label_userId_idx" ON "Label"("userId");
CREATE INDEX IF NOT EXISTS "ContactNote_contactId_idx" ON "ContactNote"("contactId");
