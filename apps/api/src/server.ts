import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./lib/env.js";
import { healthRoutes } from "./routes/health.js";
import { webhookRoutes } from "./routes/webhook.js";
import { crudRoutes } from "./routes/crud.js";
import { authRoutes } from "./routes/auth.js";
import { businessRoutes } from "./routes/business.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(healthRoutes);
await app.register(authRoutes);
await app.register(webhookRoutes);
await app.register(crudRoutes);
await app.register(businessRoutes);

app.listen({ port: env.API_PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
