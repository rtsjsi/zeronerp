-- Payable invoice: supplier invoice date, line-level GST; remove notes.
ALTER TABLE `PurchaseInvoice` ADD `invoiceDate` text;
UPDATE `PurchaseInvoice` SET `invoiceDate` = substr(`createdAt`, 1, 10) WHERE `invoiceDate` IS NULL;
ALTER TABLE `PurchaseInvoice` DROP COLUMN `notes`;
ALTER TABLE `PurchaseInvoiceItem` ADD `gstRate` real NOT NULL DEFAULT 0;
