ALTER TABLE `posts` ADD `allow_comment` integer DEFAULT 1 NOT NULL;

ALTER TABLE `site_settings` ADD `comments_per_page` integer DEFAULT 20 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_order` text DEFAULT 'ASC' NOT NULL;
ALTER TABLE `site_settings` ADD `comments_default_page` text DEFAULT 'last' NOT NULL;
ALTER TABLE `site_settings` ADD `comments_threaded` integer DEFAULT 1 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_max_nesting_levels` integer DEFAULT 5 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_markdown` integer DEFAULT 1 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_show_url` integer DEFAULT 1 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_url_nofollow` integer DEFAULT 1 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_avatar` integer DEFAULT 1 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_require_moderation` integer DEFAULT 0 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_whitelist` integer DEFAULT 1 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_require_mail` integer DEFAULT 1 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_require_url` integer DEFAULT 0 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_check_referer` integer DEFAULT 1 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_anti_spam` integer DEFAULT 1 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_post_interval` integer DEFAULT 60 NOT NULL;
ALTER TABLE `site_settings` ADD `comments_auto_close_days` integer DEFAULT 0 NOT NULL;

CREATE TABLE `comments` (
  `id` text PRIMARY KEY NOT NULL,
  `post_id` text NOT NULL,
  `parent_id` text,
  `author_id` text,
  `author` text NOT NULL,
  `mail` text NOT NULL DEFAULT '',
  `url` text NOT NULL DEFAULT '',
  `ip` text NOT NULL DEFAULT '',
  `agent` text NOT NULL DEFAULT '',
  `text` text NOT NULL,
  `status` text DEFAULT 'waiting' NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`parent_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `comments_post_status_created_idx`
  ON `comments` (`post_id`, `status`, `created_at`);
CREATE INDEX `comments_parent_id_idx` ON `comments` (`parent_id`);
CREATE INDEX `comments_mail_status_idx` ON `comments` (`mail`, `status`);
CREATE INDEX `comments_ip_created_idx` ON `comments` (`ip`, `created_at`);
