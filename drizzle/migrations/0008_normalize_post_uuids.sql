CREATE TEMP TABLE `_post_uuid_map` (
  `old_id` text PRIMARY KEY NOT NULL,
  `new_id` text NOT NULL,
  `original_slug` text NOT NULL
);

INSERT INTO `_post_uuid_map` (`old_id`, `new_id`, `original_slug`)
SELECT
  `id`,
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-' ||
  '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', (abs(random()) % 4) + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6))),
  `slug`
FROM `posts`
WHERE length(`id`) <> 36
   OR substr(`id`, 9, 1) <> '-'
   OR substr(`id`, 14, 1) <> '-'
   OR substr(`id`, 19, 1) <> '-'
   OR substr(`id`, 24, 1) <> '-';

UPDATE `posts`
SET `slug` = '__uuid_migration__' || `id`
WHERE `id` IN (SELECT `old_id` FROM `_post_uuid_map`);

INSERT INTO `posts` (
  `id`, `title`, `slug`, `excerpt`, `content`, `rendered_content`,
  `rendered_content_updated_at`, `status`, `allow_comment`, `published_at`,
  `category_id`, `created_at`, `updated_at`
)
SELECT
  map.`new_id`, posts.`title`, map.`original_slug`, posts.`excerpt`,
  posts.`content`, posts.`rendered_content`, posts.`rendered_content_updated_at`,
  posts.`status`, posts.`allow_comment`, posts.`published_at`,
  posts.`category_id`, posts.`created_at`, posts.`updated_at`
FROM `posts`
JOIN `_post_uuid_map` map ON map.`old_id` = posts.`id`;

UPDATE `posts_to_tags`
SET `post_id` = (
  SELECT map.`new_id` FROM `_post_uuid_map` map
  WHERE map.`old_id` = `posts_to_tags`.`post_id`
)
WHERE `post_id` IN (SELECT `old_id` FROM `_post_uuid_map`);

UPDATE `comments`
SET `post_id` = (
  SELECT map.`new_id` FROM `_post_uuid_map` map
  WHERE map.`old_id` = `comments`.`post_id`
)
WHERE `post_id` IN (SELECT `old_id` FROM `_post_uuid_map`);

DELETE FROM `posts`
WHERE `id` IN (SELECT `old_id` FROM `_post_uuid_map`);

DROP TABLE `_post_uuid_map`;
