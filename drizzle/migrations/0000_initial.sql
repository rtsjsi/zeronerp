PRAGMA foreign_keys = ON;
--> statement-breakpoint
CREATE TABLE `Stores` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`domain` text,
	`logo` text,
	`settings` text DEFAULT '{}' NOT NULL,
	`customTerms` text DEFAULT '{}' NOT NULL,
	`aiEnabled` integer DEFAULT 1 NOT NULL,
	`isActive` integer DEFAULT 1 NOT NULL,
	`isDeleted` integer DEFAULT 0 NOT NULL,
	`address` text,
	`gstn` text,
	`contactNumber` text,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Stores_slug_unique` ON `Stores` (`slug`);
--> statement-breakpoint
CREATE TABLE `ApplicationUsers` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text,
	`email` text NOT NULL,
	`fullName` text NOT NULL,
	`supabaseUid` text NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`isActive` integer DEFAULT 1 NOT NULL,
	`isDeleted` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ApplicationUsers_supabaseUid_unique` ON `ApplicationUsers` (`supabaseUid`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ApplicationUsers_storeId_email` ON `ApplicationUsers` (`storeId`, `email`);
--> statement-breakpoint
CREATE TABLE `Item` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`uom` text DEFAULT 'pcs' NOT NULL,
	`basePrice` real DEFAULT 0 NOT NULL,
	`customFields` text DEFAULT '{}' NOT NULL,
	`isActive` integer DEFAULT 1 NOT NULL,
	`isDeleted` integer DEFAULT 0 NOT NULL,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Item_storeId_sku` ON `Item` (`storeId`, `sku`);
--> statement-breakpoint
CREATE TABLE `Warehouse` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`location` text,
	`isActive` integer DEFAULT 1 NOT NULL,
	`isDeleted` integer DEFAULT 0 NOT NULL,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Warehouse_storeId_code` ON `Warehouse` (`storeId`, `code`);
--> statement-breakpoint
CREATE TABLE `Stock` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`itemId` text NOT NULL,
	`warehouseId` text NOT NULL,
	`quantity` real DEFAULT 0 NOT NULL,
	`reserved` real DEFAULT 0 NOT NULL,
	`reorderLevel` real DEFAULT 0 NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Stock_itemId_warehouseId` ON `Stock` (`itemId`, `warehouseId`);
--> statement-breakpoint
CREATE TABLE `InventoryTransaction` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`itemId` text NOT NULL,
	`warehouseId` text NOT NULL,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`reference` text,
	`performedBy` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Vendor` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`name` text NOT NULL,
	`contactName` text,
	`email` text,
	`phone` text,
	`address` text,
	`customFields` text DEFAULT '{}' NOT NULL,
	`isActive` integer DEFAULT 1 NOT NULL,
	`isDeleted` integer DEFAULT 0 NOT NULL,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Vendor_storeId_name` ON `Vendor` (`storeId`, `name`);
--> statement-breakpoint
CREATE TABLE `PurchaseOrder` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`vendorId` text NOT NULL,
	`poNumber` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`totalAmount` real DEFAULT 0 NOT NULL,
	`notes` text,
	`isDeleted` integer DEFAULT 0 NOT NULL,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PurchaseOrder_storeId_poNumber` ON `PurchaseOrder` (`storeId`, `poNumber`);
--> statement-breakpoint
CREATE TABLE `PurchaseOrderItem` (
	`id` text PRIMARY KEY NOT NULL,
	`poId` text NOT NULL,
	`itemId` text NOT NULL,
	`quantity` real NOT NULL,
	`unitPrice` real NOT NULL,
	`totalPrice` real NOT NULL,
	FOREIGN KEY (`poId`) REFERENCES `PurchaseOrder`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Customer` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`name` text NOT NULL,
	`contactName` text,
	`email` text,
	`phone` text,
	`address` text,
	`customFields` text DEFAULT '{}' NOT NULL,
	`isActive` integer DEFAULT 1 NOT NULL,
	`isDeleted` integer DEFAULT 0 NOT NULL,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Customer_storeId_name` ON `Customer` (`storeId`, `name`);
--> statement-breakpoint
CREATE TABLE `SalesOrder` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`customerId` text NOT NULL,
	`soNumber` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`totalAmount` real DEFAULT 0 NOT NULL,
	`notes` text,
	`isDeleted` integer DEFAULT 0 NOT NULL,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `SalesOrder_storeId_soNumber` ON `SalesOrder` (`storeId`, `soNumber`);
--> statement-breakpoint
CREATE TABLE `SalesOrderItem` (
	`id` text PRIMARY KEY NOT NULL,
	`soId` text NOT NULL,
	`itemId` text NOT NULL,
	`quantity` real NOT NULL,
	`unitPrice` real NOT NULL,
	`totalPrice` real NOT NULL,
	FOREIGN KEY (`soId`) REFERENCES `SalesOrder`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `PurchaseInvoice` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`vendorId` text NOT NULL,
	`invoiceNumber` text NOT NULL,
	`financialYear` text NOT NULL,
	`status` text DEFAULT 'COMPLETED' NOT NULL,
	`totalAmount` real DEFAULT 0 NOT NULL,
	`notes` text,
	`poId` text,
	`isDeleted` integer DEFAULT 0 NOT NULL,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`poId`) REFERENCES `PurchaseOrder`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PurchaseInvoice_store_vendor_number_year` ON `PurchaseInvoice` (`storeId`,`vendorId`,`invoiceNumber`,`financialYear`);
--> statement-breakpoint
CREATE TABLE `PurchaseInvoiceItem` (
	`id` text PRIMARY KEY NOT NULL,
	`invoiceId` text NOT NULL,
	`itemId` text NOT NULL,
	`warehouseId` text NOT NULL,
	`quantity` real NOT NULL,
	`unitPrice` real NOT NULL,
	`totalPrice` real NOT NULL,
	FOREIGN KEY (`invoiceId`) REFERENCES `PurchaseInvoice`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `SalesInvoice` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`customerId` text NOT NULL,
	`invoiceNumber` text NOT NULL,
	`financialYear` text NOT NULL,
	`status` text DEFAULT 'COMPLETED' NOT NULL,
	`totalAmount` real DEFAULT 0 NOT NULL,
	`notes` text,
	`soId` text,
	`paymentMethod` text DEFAULT 'CASH' NOT NULL,
	`amountReceived` real DEFAULT 0 NOT NULL,
	`amountReturned` real DEFAULT 0 NOT NULL,
	`isDeleted` integer DEFAULT 0 NOT NULL,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`soId`) REFERENCES `SalesOrder`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `SalesInvoice_store_number_year` ON `SalesInvoice` (`storeId`,`invoiceNumber`,`financialYear`);
--> statement-breakpoint
CREATE TABLE `SalesInvoiceItem` (
	`id` text PRIMARY KEY NOT NULL,
	`invoiceId` text NOT NULL,
	`itemId` text NOT NULL,
	`warehouseId` text NOT NULL,
	`quantity` real NOT NULL,
	`unitPrice` real NOT NULL,
	`totalPrice` real NOT NULL,
	FOREIGN KEY (`invoiceId`) REFERENCES `SalesInvoice`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ProductionBatch` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`batchNumber` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`notes` text,
	`startTime` text,
	`endTime` text,
	`isDeleted` integer DEFAULT 0 NOT NULL,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ProductionMaterial` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`batchId` text NOT NULL,
	`itemId` text NOT NULL,
	`warehouseId` text NOT NULL,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batchId`) REFERENCES `ProductionBatch`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON UPDATE no action ON DELETE no action
);
