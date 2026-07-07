ALTER TABLE `ApplicationUsers` RENAME COLUMN `email` TO `username`;
--> statement-breakpoint
DROP INDEX IF EXISTS `ApplicationUsers_storeId_email`;
--> statement-breakpoint
CREATE UNIQUE INDEX `ApplicationUsers_storeId_username` ON `ApplicationUsers` (`storeId`, `username`);
--> statement-breakpoint
UPDATE `ApplicationUsers` SET `username` = 'super_admin' WHERE `role` = 'SUPER_ADMIN';
