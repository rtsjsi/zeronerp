-- Vendor and Customer masters store Indian tax identifiers.
ALTER TABLE `Vendor` ADD COLUMN `pan` text;
ALTER TABLE `Vendor` ADD COLUMN `gstn` text;
ALTER TABLE `Customer` ADD COLUMN `pan` text;
ALTER TABLE `Customer` ADD COLUMN `gstn` text;
