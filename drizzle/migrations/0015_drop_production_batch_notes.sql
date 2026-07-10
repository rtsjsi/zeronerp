-- Production batches no longer store free-text notes.
ALTER TABLE `ProductionBatch` DROP COLUMN `notes`;
