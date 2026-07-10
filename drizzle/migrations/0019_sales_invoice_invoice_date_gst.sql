-- Sales invoice: invoice date, line-level GST; remove notes.
ALTER TABLE `SalesInvoice` ADD `invoiceDate` text;
UPDATE `SalesInvoice` SET `invoiceDate` = substr(`createdAt`, 1, 10) WHERE `invoiceDate` IS NULL;
ALTER TABLE `SalesInvoice` DROP COLUMN `notes`;
ALTER TABLE `SalesInvoiceItem` ADD `gstRate` real NOT NULL DEFAULT 0;
