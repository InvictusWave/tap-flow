CREATE TABLE IF NOT EXISTS `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`business_name` text,
	`google_review_url` text,
	`pin_hash` text,
	`location` text,
	`template` text DEFAULT 'premium_black',
	`status` text DEFAULT 'unassigned' NOT NULL,
	`total_scans` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `cards_slug_unique` ON `cards` (`slug`);
CREATE INDEX IF NOT EXISTS `idx_cards_slug` ON `cards` (`slug`);
CREATE INDEX IF NOT EXISTS `idx_cards_status` ON `cards` (`status`);

CREATE TABLE IF NOT EXISTS `card_scans` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`scanned_at` integer DEFAULT (unixepoch()) NOT NULL,
	`user_agent` text,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX IF NOT EXISTS `idx_card_scans_card_id` ON `card_scans` (`card_id`);
