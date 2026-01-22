DROP TABLE IF EXISTS "Vote";--> statement-breakpoint
DROP TABLE IF EXISTS "Message";--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "chat_user_created_at_idx" ON "Chat" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "message_chat_created_at_idx" ON "Message_v2" USING btree ("chatId","createdAt");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "service_config_user_service_name_idx" ON "ServiceConfig" USING btree ("userId","serviceName");