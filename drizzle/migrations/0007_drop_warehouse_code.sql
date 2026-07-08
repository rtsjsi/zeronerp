DROP INDEX IF EXISTS `Warehouse_storeId_code`;
--> statement-breakpoint
ALTER TABLE `Warehouse` DROP COLUMN `code`;
--> statement-breakpoint
CREATE UNIQUE INDEX `Warehouse_storeId_name` ON `Warehouse` (`storeId`, `name`);
