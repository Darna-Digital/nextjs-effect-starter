CREATE TABLE `workflow_events` (
	`id` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`correlation_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`run_id` varchar(255) NOT NULL,
	`payload` json,
	`payload_cbor` blob,
	`spec_version` int,
	CONSTRAINT `workflow_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_hooks` (
	`run_id` varchar(255) NOT NULL,
	`hook_id` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`owner_id` varchar(255) NOT NULL,
	`project_id` varchar(255) NOT NULL,
	`environment` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`metadata` json,
	`metadata_cbor` blob,
	`spec_version` int,
	`is_webhook` boolean,
	CONSTRAINT `workflow_hooks_hook_id` PRIMARY KEY(`hook_id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_job_idempotency` (
	`idempotency_key` varchar(255) NOT NULL,
	`message_id` varchar(255) NOT NULL,
	`queue_name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_job_idempotency_idempotency_key` PRIMARY KEY(`idempotency_key`)
);
--> statement-breakpoint
CREATE TABLE `workflow_jobs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`job_id` varchar(255) NOT NULL,
	`queue_name` varchar(255) NOT NULL,
	`payload` blob NOT NULL,
	`status` enum('pending','processing','failed') NOT NULL DEFAULT 'pending',
	`attempt` int NOT NULL DEFAULT 0,
	`max_attempts` int NOT NULL DEFAULT 3,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`locked_at` timestamp,
	`locked_by` varchar(255),
	`error` text,
	`scheduled_for` timestamp,
	CONSTRAINT `workflow_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `workflow_jobs_job_id_unique` UNIQUE(`job_id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_runs` (
	`id` varchar(255) NOT NULL,
	`output` json,
	`output_cbor` blob,
	`deployment_id` varchar(255) NOT NULL,
	`status` enum('pending','running','completed','failed','cancelled') NOT NULL,
	`name` varchar(255) NOT NULL,
	`execution_context` json,
	`execution_context_cbor` blob,
	`input` json,
	`input_cbor` blob,
	`error` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`started_at` timestamp,
	`spec_version` int,
	`expired_at` timestamp,
	CONSTRAINT `workflow_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_steps` (
	`run_id` varchar(255) NOT NULL,
	`step_id` varchar(255) NOT NULL,
	`step_name` varchar(255) NOT NULL,
	`status` enum('pending','running','completed','failed','cancelled') NOT NULL,
	`input` json,
	`input_cbor` blob,
	`output` json,
	`output_cbor` blob,
	`error` text,
	`attempt` int NOT NULL,
	`started_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`retry_after` timestamp,
	`spec_version` int,
	CONSTRAINT `workflow_steps_step_id` PRIMARY KEY(`step_id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_stream_chunks` (
	`id` varchar(255) NOT NULL,
	`stream_id` varchar(255) NOT NULL,
	`data` blob NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`eof` boolean NOT NULL,
	`sequence` bigint NOT NULL,
	CONSTRAINT `workflow_stream_chunks_stream_id_id_pk` PRIMARY KEY(`stream_id`,`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_workflow_events_run_id` ON `workflow_events` (`run_id`);--> statement-breakpoint
CREATE INDEX `idx_workflow_events_correlation_id` ON `workflow_events` (`correlation_id`);--> statement-breakpoint
CREATE INDEX `idx_workflow_hooks_run_id` ON `workflow_hooks` (`run_id`);--> statement-breakpoint
CREATE INDEX `idx_workflow_hooks_token` ON `workflow_hooks` (`token`);--> statement-breakpoint
CREATE INDEX `idx_idempotency_created` ON `workflow_job_idempotency` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_jobs_queue_status` ON `workflow_jobs` (`queue_name`,`status`,`id`);--> statement-breakpoint
CREATE INDEX `idx_jobs_scheduled` ON `workflow_jobs` (`scheduled_for`);--> statement-breakpoint
CREATE INDEX `idx_workflow_runs_name` ON `workflow_runs` (`name`);--> statement-breakpoint
CREATE INDEX `idx_workflow_runs_status` ON `workflow_runs` (`status`);--> statement-breakpoint
CREATE INDEX `idx_workflow_steps_run_id` ON `workflow_steps` (`run_id`);--> statement-breakpoint
CREATE INDEX `idx_workflow_steps_status` ON `workflow_steps` (`status`);--> statement-breakpoint
CREATE INDEX `idx_stream_chunks_sequence` ON `workflow_stream_chunks` (`stream_id`,`sequence`);