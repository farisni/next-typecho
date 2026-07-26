ALTER TABLE `comments` ADD `reply_to_id` text
  REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE set null;

UPDATE `comments`
SET `reply_to_id` = `parent_id`
WHERE `parent_id` IS NOT NULL;

UPDATE `site_settings`
SET `comments_max_nesting_levels` = 2;

CREATE INDEX `comments_reply_to_id_idx` ON `comments` (`reply_to_id`);
