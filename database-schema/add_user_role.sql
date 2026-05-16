-- Add Role column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'USER';

-- Update all existing users to be ADMIN for now (so the user doesn't lose access)
UPDATE "User" SET "role" = 'ADMIN';

-- Permissions
GRANT ALL ON TABLE "User" TO postgres, anon, authenticated, service_role;
