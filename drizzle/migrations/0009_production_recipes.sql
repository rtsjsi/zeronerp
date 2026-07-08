CREATE TABLE `Recipe` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`name` text NOT NULL,
	`finishedItemId` text NOT NULL,
	`outputQuantity` real DEFAULT 1 NOT NULL,
	`notes` text,
	`isActive` integer DEFAULT 1 NOT NULL,
	`isDeleted` integer DEFAULT 0 NOT NULL,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`finishedItemId`) REFERENCES `Item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `RecipeLine` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`recipeId` text NOT NULL,
	`rawItemId` text NOT NULL,
	`quantity` real NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rawItemId`) REFERENCES `Item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `ProductionBatch` ADD `recipeId` text REFERENCES `Recipe`(`id`);
