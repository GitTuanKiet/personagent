CREATE TABLE "application" (
	"user_id" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_data" jsonb,
	"use_vision" boolean DEFAULT false NOT NULL,
	"recursion_limit" integer DEFAULT 10 NOT NULL,
	"browser_profile" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_i_d" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"reference_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'incomplete',
	"period_start" timestamp,
	"period_end" timestamp,
	"cancel_at_period_end" boolean,
	"seats" integer
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"two_factor_enabled" boolean,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	"is_anonymous" boolean,
	"stripe_customer_id" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assistant" (
	"assistant_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"graph_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"name" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "assistant_versions" (
	"assistant_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"graph_id" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"name" text
);
--> statement-breakpoint
CREATE TABLE "checkpoint_blobs" (
	"thread_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"version" text NOT NULL,
	"type" text NOT NULL,
	"blob" "bytea",
	"checkpoint_ns" text DEFAULT ''::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkpoint_writes" (
	"thread_id" uuid NOT NULL,
	"checkpoint_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"idx" integer NOT NULL,
	"channel" text NOT NULL,
	"type" text NOT NULL,
	"blob" "bytea" NOT NULL,
	"checkpoint_ns" text DEFAULT ''::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkpoints" (
	"thread_id" uuid NOT NULL,
	"checkpoint_id" uuid NOT NULL,
	"run_id" uuid,
	"parent_checkpoint_id" uuid,
	"checkpoint" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"checkpoint_ns" text DEFAULT ''::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cron" (
	"cron_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assistant_id" uuid,
	"thread_id" uuid,
	"user_id" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"schedule" text NOT NULL,
	"next_run_date" timestamp with time zone,
	"end_time" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "run" (
	"run_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"assistant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"kwargs" jsonb NOT NULL,
	"multitask_strategy" text DEFAULT 'reject' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schema_migrations" (
	"version" bigint PRIMARY KEY NOT NULL,
	"dirty" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store" (
	"prefix" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"ttl_minutes" integer
);
--> statement-breakpoint
CREATE TABLE "thread" (
	"thread_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"values" jsonb,
	"interrupts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" "bytea"
);
--> statement-breakpoint
CREATE TABLE "thread_ttl" (
	"thread_id" uuid NOT NULL,
	"strategy" text DEFAULT 'delete' NOT NULL,
	"ttl_minutes" numeric NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') NOT NULL,
	"expires_at" timestamp GENERATED ALWAYS AS ((created_at + ((ttl_minutes)::double precision * '00:01:00'::interval))) STORED,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assistant_assistant_id_index" ON "assistant" USING btree ("assistant_id");--> statement-breakpoint
CREATE INDEX "assistant_metadata_idx" ON "assistant" USING btree ("metadata");--> statement-breakpoint
CREATE INDEX "assistant_graph_id_idx" ON "assistant" USING btree ("graph_id","created_at");--> statement-breakpoint
CREATE INDEX "assistant_created_at_idx" ON "assistant" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "assistant_versions_pkey" ON "assistant_versions" USING btree ("assistant_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "checkpoint_blobs_pkey" ON "checkpoint_blobs" USING btree ("thread_id","checkpoint_ns","channel","version");--> statement-breakpoint
CREATE UNIQUE INDEX "checkpoint_writes_pkey" ON "checkpoint_writes" USING btree ("thread_id","checkpoint_ns","checkpoint_id","task_id","idx");--> statement-breakpoint
CREATE INDEX "checkpoints_run_id_idx" ON "checkpoints" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "checkpoints_checkpoint_id_idx" ON "checkpoints" USING btree ("thread_id","checkpoint_id");--> statement-breakpoint
CREATE UNIQUE INDEX "checkpoints_pkey" ON "checkpoints" USING btree ("thread_id","checkpoint_ns","checkpoint_id");--> statement-breakpoint
CREATE INDEX "run_pending_idx" ON "run" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "run_assistant_id_idx" ON "run" USING btree ("assistant_id");--> statement-breakpoint
CREATE INDEX "run_metadata_idx" ON "run" USING btree ("thread_id","metadata");--> statement-breakpoint
CREATE INDEX "run_thread_id_status_idx" ON "run" USING btree ("thread_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "run_running_one_per_thread" ON "run" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "run_pending_by_thread_time" ON "run" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "store_pkey" ON "store" USING btree ("prefix","key");--> statement-breakpoint
CREATE INDEX "store_prefix_idx" ON "store" USING btree ("prefix");--> statement-breakpoint
CREATE INDEX "idx_store_expires_at" ON "store" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "thread_status_idx" ON "thread" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "thread_metadata_idx" ON "thread" USING btree ("metadata");--> statement-breakpoint
CREATE INDEX "thread_values_idx" ON "thread" USING btree ("values");--> statement-breakpoint
CREATE INDEX "thread_created_at_idx" ON "thread" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_thread_ttl_expires_at" ON "thread_ttl" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_thread_ttl_thread_id" ON "thread_ttl" USING btree ("thread_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_thread_ttl_thread_strategy" ON "thread_ttl" USING btree ("thread_id","strategy");