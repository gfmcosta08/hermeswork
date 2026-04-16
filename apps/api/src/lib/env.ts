import { z } from "zod";

const envSchema = z.object({
  API_PORT: z.coerce.number().default(3333),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  WEBHOOK_HMAC_SECRET: z.string().min(16),
  AGENT_ROUTER_SECRET: z.string().min(16),
  JWT_SECRET: z.string().min(16),
  WHATSAPP_PROVIDER_URL: z.string().url().optional(),
  WHATSAPP_PROVIDER_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
