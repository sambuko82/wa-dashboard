-- Create missing wa-dashboard Prisma tables (safe: no DROP TABLE)

-- WaNumberNote
CREATE TABLE IF NOT EXISTS "WaNumberNote" (
    "id" TEXT NOT NULL,
    "waNumberId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WaNumberNote_pkey" PRIMARY KEY ("id")
);

-- WaNumberReminder
CREATE TABLE IF NOT EXISTS "WaNumberReminder" (
    "id" TEXT NOT NULL,
    "waNumberId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WaNumberReminder_pkey" PRIMARY KEY ("id")
);

-- Contact
CREATE TABLE IF NOT EXISTS "Contact" (
    "id" TEXT NOT NULL,
    "waNumberId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "notes" TEXT,
    "customFields" JSONB,
    "pipelineStageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- PipelineStage
CREATE TABLE IF NOT EXISTS "PipelineStage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#25d366',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- Reminder
CREATE TABLE IF NOT EXISTS "Reminder" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- Label
CREATE TABLE IF NOT EXISTS "Label" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#25d366',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- ContactNote
CREATE TABLE IF NOT EXISTS "ContactNote" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContactNote_pkey" PRIMARY KEY ("id")
);

-- JvtoCrmContact
CREATE TABLE IF NOT EXISTS "JvtoCrmContact" (
    "id" TEXT NOT NULL,
    "jvtoCustomerId" TEXT NOT NULL,
    "pipelineStageId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JvtoCrmContact_pkey" PRIMARY KEY ("id")
);

-- JvtoCrmNote
CREATE TABLE IF NOT EXISTS "JvtoCrmNote" (
    "id" TEXT NOT NULL,
    "crmContactId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JvtoCrmNote_pkey" PRIMARY KEY ("id")
);

-- JvtoCrmReminder
CREATE TABLE IF NOT EXISTS "JvtoCrmReminder" (
    "id" TEXT NOT NULL,
    "crmContactId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JvtoCrmReminder_pkey" PRIMARY KEY ("id")
);

-- M2M join tables
CREATE TABLE IF NOT EXISTS "_ContactLabels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContactLabels_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE TABLE IF NOT EXISTS "_JvtoCrmContactLabels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_JvtoCrmContactLabels_AB_pkey" PRIMARY KEY ("A","B")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "WaNumberNote_waNumberId_idx" ON "WaNumberNote"("waNumberId");
CREATE INDEX IF NOT EXISTS "WaNumberReminder_waNumberId_idx" ON "WaNumberReminder"("waNumberId");
CREATE INDEX IF NOT EXISTS "WaNumberReminder_dueDate_idx" ON "WaNumberReminder"("dueDate");
CREATE INDEX IF NOT EXISTS "Contact_waNumberId_idx" ON "Contact"("waNumberId");
CREATE INDEX IF NOT EXISTS "Contact_pipelineStageId_idx" ON "Contact"("pipelineStageId");
CREATE UNIQUE INDEX IF NOT EXISTS "Contact_waNumberId_phoneNumber_key" ON "Contact"("waNumberId", "phoneNumber");
CREATE INDEX IF NOT EXISTS "PipelineStage_userId_idx" ON "PipelineStage"("userId");
CREATE INDEX IF NOT EXISTS "Reminder_contactId_idx" ON "Reminder"("contactId");
CREATE INDEX IF NOT EXISTS "Reminder_dueDate_idx" ON "Reminder"("dueDate");
CREATE INDEX IF NOT EXISTS "Label_userId_idx" ON "Label"("userId");
CREATE INDEX IF NOT EXISTS "ContactNote_contactId_idx" ON "ContactNote"("contactId");
CREATE UNIQUE INDEX IF NOT EXISTS "JvtoCrmContact_jvtoCustomerId_key" ON "JvtoCrmContact"("jvtoCustomerId");
CREATE INDEX IF NOT EXISTS "JvtoCrmContact_pipelineStageId_idx" ON "JvtoCrmContact"("pipelineStageId");
CREATE INDEX IF NOT EXISTS "JvtoCrmNote_crmContactId_idx" ON "JvtoCrmNote"("crmContactId");
CREATE INDEX IF NOT EXISTS "JvtoCrmReminder_crmContactId_idx" ON "JvtoCrmReminder"("crmContactId");
CREATE INDEX IF NOT EXISTS "JvtoCrmReminder_dueDate_idx" ON "JvtoCrmReminder"("dueDate");
CREATE INDEX IF NOT EXISTS "_ContactLabels_B_index" ON "_ContactLabels"("B");
CREATE INDEX IF NOT EXISTS "_JvtoCrmContactLabels_B_index" ON "_JvtoCrmContactLabels"("B");
CREATE INDEX IF NOT EXISTS "MessageLog_numberId_idx" ON "MessageLog"("numberId");
CREATE INDEX IF NOT EXISTS "MessageLog_contactId_idx" ON "MessageLog"("contactId");
CREATE INDEX IF NOT EXISTS "MessageLog_createdAt_idx" ON "MessageLog"("createdAt");
CREATE INDEX IF NOT EXISTS "MessageLog_toFrom_idx" ON "MessageLog"("toFrom");

-- Foreign keys (only for new tables, skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WaNumberNote_waNumberId_fkey') THEN
    ALTER TABLE "WaNumberNote" ADD CONSTRAINT "WaNumberNote_waNumberId_fkey" FOREIGN KEY ("waNumberId") REFERENCES "WaNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WaNumberReminder_waNumberId_fkey') THEN
    ALTER TABLE "WaNumberReminder" ADD CONSTRAINT "WaNumberReminder_waNumberId_fkey" FOREIGN KEY ("waNumberId") REFERENCES "WaNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MessageLog_contactId_fkey') THEN
    ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Contact_waNumberId_fkey') THEN
    ALTER TABLE "Contact" ADD CONSTRAINT "Contact_waNumberId_fkey" FOREIGN KEY ("waNumberId") REFERENCES "WaNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Contact_pipelineStageId_fkey') THEN
    ALTER TABLE "Contact" ADD CONSTRAINT "Contact_pipelineStageId_fkey" FOREIGN KEY ("pipelineStageId") REFERENCES "PipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PipelineStage_userId_fkey') THEN
    ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Reminder_contactId_fkey') THEN
    ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Label_userId_fkey') THEN
    ALTER TABLE "Label" ADD CONSTRAINT "Label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContactNote_contactId_fkey') THEN
    ALTER TABLE "ContactNote" ADD CONSTRAINT "ContactNote_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JvtoCrmContact_pipelineStageId_fkey') THEN
    ALTER TABLE "JvtoCrmContact" ADD CONSTRAINT "JvtoCrmContact_pipelineStageId_fkey" FOREIGN KEY ("pipelineStageId") REFERENCES "PipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JvtoCrmNote_crmContactId_fkey') THEN
    ALTER TABLE "JvtoCrmNote" ADD CONSTRAINT "JvtoCrmNote_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "JvtoCrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JvtoCrmReminder_crmContactId_fkey') THEN
    ALTER TABLE "JvtoCrmReminder" ADD CONSTRAINT "JvtoCrmReminder_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "JvtoCrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ContactLabels_A_fkey') THEN
    ALTER TABLE "_ContactLabels" ADD CONSTRAINT "_ContactLabels_A_fkey" FOREIGN KEY ("A") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ContactLabels_B_fkey') THEN
    ALTER TABLE "_ContactLabels" ADD CONSTRAINT "_ContactLabels_B_fkey" FOREIGN KEY ("B") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_JvtoCrmContactLabels_A_fkey') THEN
    ALTER TABLE "_JvtoCrmContactLabels" ADD CONSTRAINT "_JvtoCrmContactLabels_A_fkey" FOREIGN KEY ("A") REFERENCES "JvtoCrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_JvtoCrmContactLabels_B_fkey') THEN
    ALTER TABLE "_JvtoCrmContactLabels" ADD CONSTRAINT "_JvtoCrmContactLabels_B_fkey" FOREIGN KEY ("B") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
