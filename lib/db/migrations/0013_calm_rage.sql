DO $$ BEGIN
 CREATE TYPE "public"."mcp_transport" AS ENUM('sse', 'http');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."skill_source" AS ENUM('user', 'plugin', 'builtin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "MCPServerConfig" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"url" text NOT NULL,
	"transport" "mcp_transport" DEFAULT 'sse' NOT NULL,
	"apiKey" text,
	"headers" json,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"lastHealthCheck" timestamp,
	"availableTools" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserSkill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"displayName" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"instructions" text NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"source" "skill_source" DEFAULT 'user' NOT NULL,
	"pluginName" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ServiceConfig" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "ServiceConfig" ADD COLUMN "password" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "MCPServerConfig" ADD CONSTRAINT "MCPServerConfig_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mcp_server_config_user_idx" ON "MCPServerConfig" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mcp_server_config_user_name_idx" ON "MCPServerConfig" USING btree ("userId","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_skill_user_idx" ON "UserSkill" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_skill_user_name_idx" ON "UserSkill" USING btree ("userId","name");