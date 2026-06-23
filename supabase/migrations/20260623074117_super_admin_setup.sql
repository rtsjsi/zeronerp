-- Make tenantId nullable for Super Admins
ALTER TABLE "User" ALTER COLUMN "tenantId" DROP NOT NULL;

-- Add new fields to Tenant for Super Admin management
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "gstn" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "contactNumber" TEXT;

-- Update the existing User role constraint if there is one, or just rely on TEXT
-- Since 'role' was added as TEXT with default 'USER', we can just use 'SUPER_ADMIN' as a value.

-- Ensure permissions
GRANT ALL ON TABLE "User" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "Tenant" TO postgres, anon, authenticated, service_role;
