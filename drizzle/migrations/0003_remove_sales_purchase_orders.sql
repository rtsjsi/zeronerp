PRAGMA foreign_keys=OFF;

CREATE TABLE `PurchaseInvoice__new` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`vendorId` text NOT NULL,
	`invoiceNumber` text NOT NULL,
	`financialYear` text NOT NULL,
	`status` text DEFAULT 'COMPLETED' NOT NULL,
	`totalAmount` real DEFAULT 0 NOT NULL,
	`notes` text,
	`isDeleted` integer DEFAULT false NOT NULL,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO `PurchaseInvoice__new` (
	`id`,
	`storeId`,
	`vendorId`,
	`invoiceNumber`,
	`financialYear`,
	`status`,
	`totalAmount`,
	`notes`,
	`isDeleted`,
	`createdBy`,
	`createdAt`,
	`updatedAt`
)
SELECT
	`id`,
	`storeId`,
	`vendorId`,
	`invoiceNumber`,
	`financialYear`,
	`status`,
	`totalAmount`,
	`notes`,
	`isDeleted`,
	`createdBy`,
	`createdAt`,
	`updatedAt`
FROM `PurchaseInvoice`;
DROP TABLE `PurchaseInvoice`;
ALTER TABLE `PurchaseInvoice__new` RENAME TO `PurchaseInvoice`;
CREATE UNIQUE INDEX `PurchaseInvoice_store_vendor_number_year` ON `PurchaseInvoice` (`storeId`,`vendorId`,`invoiceNumber`,`financialYear`);

CREATE TABLE `SalesInvoice__new` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`customerId` text NOT NULL,
	`invoiceNumber` text NOT NULL,
	`financialYear` text NOT NULL,
	`status` text DEFAULT 'COMPLETED' NOT NULL,
	`totalAmount` real DEFAULT 0 NOT NULL,
	`notes` text,
	`paymentMethod` text DEFAULT 'CASH' NOT NULL,
	`amountReceived` real DEFAULT 0 NOT NULL,
	`amountReturned` real DEFAULT 0 NOT NULL,
	`isDeleted` integer DEFAULT false NOT NULL,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO `SalesInvoice__new` (
	`id`,
	`storeId`,
	`customerId`,
	`invoiceNumber`,
	`financialYear`,
	`status`,
	`totalAmount`,
	`notes`,
	`paymentMethod`,
	`amountReceived`,
	`amountReturned`,
	`isDeleted`,
	`createdBy`,
	`createdAt`,
	`updatedAt`
)
SELECT
	`id`,
	`storeId`,
	`customerId`,
	`invoiceNumber`,
	`financialYear`,
	`status`,
	`totalAmount`,
	`notes`,
	`paymentMethod`,
	`amountReceived`,
	`amountReturned`,
	`isDeleted`,
	`createdBy`,
	`createdAt`,
	`updatedAt`
FROM `SalesInvoice`;
DROP TABLE `SalesInvoice`;
ALTER TABLE `SalesInvoice__new` RENAME TO `SalesInvoice`;
CREATE UNIQUE INDEX `SalesInvoice_store_number_year` ON `SalesInvoice` (`storeId`,`invoiceNumber`,`financialYear`);

DROP TABLE IF EXISTS `SalesOrderItem`;
DROP TABLE IF EXISTS `PurchaseOrderItem`;
DROP TABLE IF EXISTS `SalesOrder`;
DROP TABLE IF EXISTS `PurchaseOrder`;

PRAGMA foreign_keys=ON;
