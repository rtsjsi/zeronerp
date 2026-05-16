-- Production Module Tables

-- 1. ProductionBatch
CREATE TABLE IF NOT EXISTS "ProductionBatch" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, IN_PROGRESS, COMPLETED, CANCELLED
    "notes" TEXT,
    "startTime" TIMESTAMP WITH TIME ZONE,
    "endTime" TIMESTAMP WITH TIME ZONE,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT "ProductionBatch_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductionBatch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

-- 2. ProductionMaterial
CREATE TABLE IF NOT EXISTS "ProductionMaterial" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "type" TEXT NOT NULL, -- INPUT (Consumption) | OUTPUT (Production)
    "quantity" DECIMAL(12,3) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT "ProductionMaterial_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductionMaterial_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductionBatch"("id") ON DELETE CASCADE,
    CONSTRAINT "ProductionMaterial_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE,
    CONSTRAINT "ProductionMaterial_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE,
    CONSTRAINT "ProductionMaterial_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS "ProductionBatch_tenantId_idx" ON "ProductionBatch"("tenantId");
CREATE INDEX IF NOT EXISTS "ProductionMaterial_batchId_idx" ON "ProductionMaterial"("batchId");
CREATE INDEX IF NOT EXISTS "ProductionMaterial_tenantId_idx" ON "ProductionMaterial"("tenantId");

-- Permissions for service_role and authenticated
GRANT ALL ON TABLE "ProductionBatch" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "ProductionMaterial" TO postgres, anon, authenticated, service_role;
