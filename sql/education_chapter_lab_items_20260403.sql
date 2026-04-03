SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'edu_chapter'
    AND COLUMN_NAME = 'labItems'
);

SET @alter_sql = IF(
  @column_exists = 0,
  'ALTER TABLE `edu_chapter` ADD COLUMN `labItems` JSON NULL COMMENT ''实验室卡片配置'' AFTER `visuals`',
  'SELECT 1'
);

PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `edu_chapter`
SET `labItems` = JSON_ARRAY(
  JSON_OBJECT('title', '点', 'icon', 'http://127.0.0.1:8001/education/lab-point.png', 'prompt', ''),
  JSON_OBJECT('title', '线', 'icon', 'http://127.0.0.1:8001/education/lab-line.png', 'prompt', ''),
  JSON_OBJECT('title', '面', 'icon', 'http://127.0.0.1:8001/education/lab-surface.png', 'prompt', '')
)
WHERE `labItems` IS NULL OR JSON_LENGTH(`labItems`) = 0;
