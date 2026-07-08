ALTER TABLE `Item` ADD `cost` real NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `Item` ADD `gstRate` real NOT NULL DEFAULT 0;
--> statement-breakpoint
UPDATE `Item` SET `cost` = CASE
  WHEN `purchasePrice` > 0 THEN `purchasePrice`
  WHEN `basePrice` > 0 THEN `basePrice`
  ELSE 0
END;
--> statement-breakpoint
UPDATE `Item` SET `gstRate` = CASE
  WHEN `igstPercent` > 0 THEN `igstPercent`
  ELSE `cgstPercent` + `sgstPercent`
END;
--> statement-breakpoint
ALTER TABLE `Item` DROP COLUMN `cgstPercent`;
--> statement-breakpoint
ALTER TABLE `Item` DROP COLUMN `sgstPercent`;
--> statement-breakpoint
ALTER TABLE `Item` DROP COLUMN `igstPercent`;
--> statement-breakpoint
ALTER TABLE `Item` DROP COLUMN `sellingPrice`;
--> statement-breakpoint
ALTER TABLE `Item` DROP COLUMN `purchasePrice`;
--> statement-breakpoint
ALTER TABLE `Item` DROP COLUMN `basePrice`;
