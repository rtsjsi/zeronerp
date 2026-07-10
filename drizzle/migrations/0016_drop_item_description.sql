-- Item master no longer stores a free-text description.
ALTER TABLE `Item` DROP COLUMN `description`;
