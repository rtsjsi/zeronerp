CREATE TABLE `ProductionOutput` (
	`id` text PRIMARY KEY NOT NULL,
	`storeId` text NOT NULL,
	`batchId` text NOT NULL,
	`recipeId` text,
	`itemId` text NOT NULL,
	`warehouseId` text NOT NULL,
	`quantity` real NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batchId`) REFERENCES `ProductionBatch`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `ProductionMaterial` ADD `outputLineId` text REFERENCES `ProductionOutput`(`id`) ON DELETE cascade;
