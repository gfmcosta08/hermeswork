import { z } from "zod";

export const webhookPayloadSchema = z.object({
  instanceToken: z.string().min(1),
  messageId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  type: z.string().optional(),
  text: z.string().optional(),
  raw: z.unknown().optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
