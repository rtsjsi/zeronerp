-- Rename Tables
ALTER TABLE "Tenant" RENAME TO "Stores";
ALTER TABLE "User" RENAME TO "ApplicationUsers";

-- Drop Unused Tables
DROP TABLE IF EXISTS "CustomFieldDefinition" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;

-- Rename foreign keys tenantId -> storeId
ALTER TABLE "ApplicationUsers" RENAME COLUMN "tenantId" TO "storeId";
ALTER TABLE "Item" RENAME COLUMN "tenantId" TO "storeId";
ALTER TABLE "Warehouse" RENAME COLUMN "tenantId" TO "storeId";
ALTER TABLE "Stock" RENAME COLUMN "tenantId" TO "storeId";
ALTER TABLE "InventoryTransaction" RENAME COLUMN "tenantId" TO "storeId";
ALTER TABLE "Customer" RENAME COLUMN "tenantId" TO "storeId";
ALTER TABLE "SalesOrder" RENAME COLUMN "tenantId" TO "storeId";
ALTER TABLE "SalesInvoice" RENAME COLUMN "tenantId" TO "storeId";
ALTER TABLE "Vendor" RENAME COLUMN "tenantId" TO "storeId";
ALTER TABLE "PurchaseOrder" RENAME COLUMN "tenantId" TO "storeId";
ALTER TABLE "PurchaseInvoice" RENAME COLUMN "tenantId" TO "storeId";
ALTER TABLE "ProductionBatch" RENAME COLUMN "tenantId" TO "storeId";
ALTER TABLE "ProductionMaterial" RENAME COLUMN "tenantId" TO "storeId";
