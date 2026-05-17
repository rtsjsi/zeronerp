-- Invoices Module Tables

-- 1. PurchaseInvoice (Payable Invoice)
CREATE TABLE IF NOT EXISTS "PurchaseInvoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, COMPLETED, CANCELLED
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "poId" UUID, -- Optional link to Purchase Order
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT "PurchaseInvoice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PurchaseInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
    CONSTRAINT "PurchaseInvoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT,
    CONSTRAINT "PurchaseInvoice_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL,
    CONSTRAINT "PurchaseInvoice_unique_vendor_invoice_fy" UNIQUE ("tenantId", "vendorId", "invoiceNumber", "financialYear")
);

-- 2. PurchaseInvoiceItem
CREATE TABLE IF NOT EXISTS "PurchaseInvoiceItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL, -- Where to receive the stock
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PurchaseInvoiceItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PurchaseInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE CASCADE,
    CONSTRAINT "PurchaseInvoiceItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT,
    CONSTRAINT "PurchaseInvoiceItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT
);

-- 3. SalesInvoice
CREATE TABLE IF NOT EXISTS "SalesInvoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, COMPLETED, CANCELLED
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "soId" UUID, -- Optional link to Sales Order
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT "SalesInvoice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SalesInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
    CONSTRAINT "SalesInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT,
    CONSTRAINT "SalesInvoice_soId_fkey" FOREIGN KEY ("soId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL,
    CONSTRAINT "SalesInvoice_unique_invoiceNumber" UNIQUE ("tenantId", "invoiceNumber", "financialYear")
);

-- 4. SalesInvoiceItem
CREATE TABLE IF NOT EXISTS "SalesInvoiceItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL, -- Where to deduct the stock
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SalesInvoiceItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SalesInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SalesInvoice"("id") ON DELETE CASCADE,
    CONSTRAINT "SalesInvoiceItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT,
    CONSTRAINT "SalesInvoiceItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT
);

-- Indexes
CREATE INDEX IF NOT EXISTS "PurchaseInvoice_tenantId_idx" ON "PurchaseInvoice"("tenantId");
CREATE INDEX IF NOT EXISTS "SalesInvoice_tenantId_idx" ON "SalesInvoice"("tenantId");

-- Permissions for service_role and authenticated
GRANT ALL ON TABLE "PurchaseInvoice" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "PurchaseInvoiceItem" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "SalesInvoice" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "SalesInvoiceItem" TO postgres, anon, authenticated, service_role;
