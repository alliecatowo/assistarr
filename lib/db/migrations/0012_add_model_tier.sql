-- Create model tier enum
DO $$ BEGIN
    CREATE TYPE "model_tier" AS ENUM ('lite', 'fast', 'heavy', 'thinking');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add preferredModelTier column to UserAIConfig
ALTER TABLE "UserAIConfig" ADD COLUMN IF NOT EXISTS "preferredModelTier" "model_tier" DEFAULT 'fast';
