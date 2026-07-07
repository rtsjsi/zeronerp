PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `ApplicationUsers_new` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text,
	`email` text NOT NULL,
	`fullName` text NOT NULL,
	`passwordHash` text NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`isActive` integer DEFAULT 1 NOT NULL,
	`isDeleted` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `ApplicationUsers_new` (`id`, `storeId`, `email`, `fullName`, `passwordHash`, `role`, `isActive`, `isDeleted`, `createdAt`, `updatedAt`)
SELECT `id`, `storeId`, `email`, `fullName`, '', `role`, `isActive`, `isDeleted`, `createdAt`, `updatedAt`
FROM `ApplicationUsers`;
--> statement-breakpoint
DROP TABLE `ApplicationUsers`;
--> statement-breakpoint
ALTER TABLE `ApplicationUsers_new` RENAME TO `ApplicationUsers`;
--> statement-breakpoint
CREATE UNIQUE INDEX `ApplicationUsers_storeId_email` ON `ApplicationUsers` (`storeId`, `email`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
