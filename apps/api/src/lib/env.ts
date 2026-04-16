import { z } from "zod";

const envSchema = z.object({
  API_PORT: z.coerce.number().default(3333),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  WEBHOOK_HMAC_SECRET: z.string().min(16),
  AGENT_ROUTER_SECRET: z.string().min(16),
  JWT_SECRET: z.string().min(16),
  INTERNAL_PROVISION_TOKEN: z.string().min(16),
  PROVISIONER_MODE: z.enum(["hostinger_api", "local_vps"]).default("local_vps"),
  PROVISIONER_ALLOWED_ORIGINS: z.string().default(""),
  HOSTINGER_API_URL: z.string().url().optional(),
  HOSTINGER_API_TOKEN: z.string().optional(),
  WHATSAPP_PROVIDER_URL: z.string().url().optional(),
  WHATSAPP_PROVIDER_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
