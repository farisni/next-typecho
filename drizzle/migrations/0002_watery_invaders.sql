CREATE TABLE `installation_state` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`installed_at` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `site_settings` ADD `site_url` text DEFAULT 'http://localhost:3000' NOT NULL;
--> statement-breakpoint
INSERT INTO `installation_state` (`id`, `installed_at`, `version`)
SELECT 1, CAST(strftime('%s', 'now') AS integer) * 1000, 1
WHERE EXISTS (SELECT 1 FROM `users` LIMIT 1);