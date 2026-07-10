-- Keep stored recipe names aligned with finished good item names.
UPDATE `Recipe`
SET `name` = (
  SELECT `name` FROM `Item` WHERE `Item`.`id` = `Recipe`.`finishedItemId`
)
WHERE `finishedItemId` IS NOT NULL;
