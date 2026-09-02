CREATE TABLE IF NOT EXISTS `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `admin_users_email_unique` ON `admin_users` (`email`);
ALTER TABLE `cards` ADD COLUMN `owner_id` text REFERENCES `admin_users`(`id`);
CREATE INDEX IF NOT EXISTS `idx_cards_owner_id` ON `cards` (`owner_id`);
