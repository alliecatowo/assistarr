import { z } from "zod";
import { isAllowedFileUrl } from "@/lib/upload-validation";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1).max(2000),
});

const blobFileUrl = z.string().url().refine(isAllowedFileUrl, {
  message: "File URL must be an https URL on the app's blob storage host",
});

const filePartSchema = z.object({
  type: z.enum(["file"]),
  mediaType: z.enum(["image/jpeg", "image/png"]),
  name: z.string().min(1).max(100),
  url: blobFileUrl,
});

const partSchema = z.union([textPartSchema, filePartSchema]);

export const userMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user"]),
  parts: z.array(partSchema),
});

// For tool approval flows, we accept all messages (more permissive schema)
const messageSchema = z.object({
  id: z.string().max(64),
  role: z.string().max(16),
  parts: z.array(z.any()).max(64),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  // Either a single new message or all messages (for tool approvals)
  message: userMessageSchema.optional(),
  messages: z.array(messageSchema).max(200).optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(["public", "private"]),
  debugMode: z.boolean().optional().default(false),
  mode: z.enum(["chat", "discover"]).optional().default("chat"),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
export type UserMessage = z.infer<typeof userMessageSchema>;
export type Message = z.infer<typeof messageSchema>;
