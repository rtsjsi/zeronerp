ALTER TABLE `Stores` DROP COLUMN `domain`;
--> statement-breakpoint
ALTER TABLE `Stores` DROP COLUMN `logo`;
--> statement-breakpoint
ALTER TABLE `Stores` DROP COLUMN `customTerms`;
--> statement-breakpoint
ALTER TABLE `Stores` DROP COLUMN `createdBy`;
--> statement-breakpoint
ALTER TABLE `Item` DROP COLUMN `customFields`;
--> statement-breakpoint
ALTER TABLE `Warehouse` DROP COLUMN `isActive`;
--> statement-breakpoint
ALTER TABLE `Vendor` DROP COLUMN `isActive`;
--> statement-breakpoint
ALTER TABLE `Customer` DROP COLUMN `isActive`;
--> statement-breakpoint
ALTER TABLE `Stock` DROP COLUMN `reserved`;
--> statement-breakpoint
ALTER TABLE `Stock` DROP COLUMN `reorderLevel`;
