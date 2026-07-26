CREATE TABLE `traffic_daily` (
  `date` text NOT NULL,
  `path` text NOT NULL,
  `page_views` integer DEFAULT 0 NOT NULL,
  `updated_at` integer NOT NULL,
  PRIMARY KEY (`date`, `path`)
);

CREATE INDEX `traffic_daily_date_idx` ON `traffic_daily` (`date`);

CREATE TABLE `traffic_visitors` (
  `date` text NOT NULL,
  `path` text NOT NULL,
  `visitor_hash` text NOT NULL,
  `created_at` integer NOT NULL,
  PRIMARY KEY (`date`, `path`, `visitor_hash`)
);

CREATE INDEX `traffic_visitors_date_idx` ON `traffic_visitors` (`date`);
