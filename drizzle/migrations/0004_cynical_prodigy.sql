CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`markdown` integer DEFAULT true NOT NULL,
	`xmlrpc_markdown` integer DEFAULT false NOT NULL,
	`auto_save` integer DEFAULT false NOT NULL,
	`default_allow_comment` integer DEFAULT true NOT NULL,
	`default_allow_ping` integer DEFAULT true NOT NULL,
	`default_allow_feed` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `user_preferences`
(`user_id`, `markdown`, `xmlrpc_markdown`, `auto_save`, `default_allow_comment`, `default_allow_ping`, `default_allow_feed`, `created_at`, `updated_at`)
SELECT `id`, 1, 0, 0, 1, 1, 1, `created_at`, `updated_at` FROM `users`;
--> statement-breakpoint
ALTER TABLE `users` ADD `url` text DEFAULT '' NOT NULL;