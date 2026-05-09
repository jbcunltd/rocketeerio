CREATE TABLE "josh_agent_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"mode" text DEFAULT 'paused' NOT NULL,
	"agent_name" text DEFAULT 'Josh' NOT NULL,
	"role_title" text DEFAULT 'Sales Agent' NOT NULL,
	"personality_tone" text DEFAULT 'friendly_casual' NOT NULL,
	"avatar_url" text,
	"skills" jsonb NOT NULL,
	"business_info" jsonb NOT NULL,
	"knowledge_base" jsonb NOT NULL,
	"behavior_rules" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "josh_agent_settings" ADD CONSTRAINT "josh_agent_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "josh_agent_settings_user_unique" ON "josh_agent_settings" USING btree ("user_id");