DO $$ BEGIN
 CREATE TYPE "public"."model_tier" AS ENUM('lite', 'fast', 'heavy', 'thinking');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "UserAIConfig" ADD COLUMN "preferredModelTier" "model_tier" DEFAULT 'fast';