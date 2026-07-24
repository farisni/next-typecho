CREATE TABLE `theme_settings` (
	`theme` text PRIMARY KEY NOT NULL,
	`config_json` text DEFAULT '{}' NOT NULL,
	`custom_css` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `site_settings` ADD `active_theme` text DEFAULT 'default' NOT NULL;