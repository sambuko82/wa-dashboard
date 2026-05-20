-- Add columns missing from MessageLog (in schema.prisma but never migrated)
ALTER TABLE "MessageLog" ADD COLUMN IF NOT EXISTS "contactId" TEXT;
ALTER TABLE "MessageLog" ADD COLUMN IF NOT EXISTS "mediaData" JSONB;

-- Add missing columns to WaNumber
ALTER TABLE "WaNumber" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Add isJvto to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isJvto" BOOLEAN NOT NULL DEFAULT false;
