CREATE TABLE `categories` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`category_id` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`description` text,
	`date` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;