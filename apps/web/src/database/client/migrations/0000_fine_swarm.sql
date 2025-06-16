CREATE TABLE "applications" (
	"name" text NOT NULL,
	"description" text,
	"headers" jsonb,
	"cookies" jsonb,
	"credentials" jsonb,
	"timeout" integer DEFAULT 30000 NOT NULL,
	"env" jsonb,
	"allowedDomains" text[] NOT NULL,
	"wssUrl" text,
	"cdpUrl" text,
	"recursionLimit" integer DEFAULT 100 NOT NULL,
	"useVision" boolean DEFAULT false NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"fingerprint" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"name" text NOT NULL,
	"description" text,
	"ageGroup" text,
	"digitalSkillLevel" text,
	"behaviorTraits" text[],
	"preferences" jsonb,
	"pinned" boolean DEFAULT false NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"fingerprint" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personas_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "simulations" (
	"personaId" integer NOT NULL,
	"applicationId" integer NOT NULL,
	"task" text NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"state" jsonb,
	"pinned" boolean DEFAULT false NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"fingerprint" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usability_issues" (
	"simulationId" integer NOT NULL,
	"personaId" integer NOT NULL,
	"description" text NOT NULL,
	"recommendation" text,
	"severity" text,
	"impact" text,
	"extra" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"fingerprint" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_personaId_personas_id_fk" FOREIGN KEY ("personaId") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_applicationId_applications_id_fk" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usability_issues" ADD CONSTRAINT "usability_issues_simulationId_simulations_id_fk" FOREIGN KEY ("simulationId") REFERENCES "public"."simulations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usability_issues" ADD CONSTRAINT "usability_issues_personaId_personas_id_fk" FOREIGN KEY ("personaId") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;