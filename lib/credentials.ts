import { z } from "zod";

/** bcrypt silently truncates input past 72 bytes; reject instead. */
export const MAX_PASSWORD_BYTES = 72;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254)
    .email()
    .transform((v) => normalizeEmail(v)),
  password: z
    .string()
    .min(6)
    .refine((v) => new TextEncoder().encode(v).length <= MAX_PASSWORD_BYTES, {
      message: "Password must be at most 72 bytes",
    }),
});
